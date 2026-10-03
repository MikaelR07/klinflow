-- Migration: Add offer.rejected domain event and notification routing
-- Description: Ensures agents get notified when a seller rejects their offer.

-- 1. Update the trigger to emit offer.rejected
CREATE OR REPLACE FUNCTION public.publish_offer_domain_events()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.publish_domain_event(
            'offer.created', 'marketplace_offer', NEW.id,
            jsonb_build_object('listing_id', NEW.listing_id, 'offered_price', NEW.offered_price),
            NEW.buyer_id
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'accepted' THEN
                PERFORM public.publish_domain_event(
                    'offer.accepted', 'marketplace_offer', NEW.id,
                    jsonb_build_object('listing_id', NEW.listing_id),
                    NEW.seller_id
                );
            ELSIF NEW.status = 'rejected' THEN
                PERFORM public.publish_domain_event(
                    'offer.rejected', 'marketplace_offer', NEW.id,
                    jsonb_build_object('listing_id', NEW.listing_id),
                    NEW.seller_id
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update the router to handle offer.rejected
CREATE OR REPLACE FUNCTION public.route_domain_event(v_event RECORD)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recipient_id UUID;
    v_actor_id UUID := v_event.actor_id;
    v_booking RECORD;
    v_listing RECORD;
    v_seller_name TEXT;
    v_buyer_name TEXT;
    v_agents_json JSON;
    v_agent JSON;
    v_agent_id UUID;
    v_config JSONB;
    v_accepted_materials JSONB;
    v_is_eligible BOOLEAN;
    v_amount NUMERIC;
    v_type TEXT;
    v_title TEXT;
    v_body TEXT;
    v_recipient_role TEXT;
    v_offer RECORD;
BEGIN
    CASE v_event.event_type

        -- ── PICKUP DOMAIN ──────────────────────────────────────────

        WHEN 'pickup.created' THEN
            SELECT * INTO v_booking FROM public.bookings WHERE id = v_event.aggregate_id;
            IF v_booking.id IS NOT NULL THEN
                IF v_booking.agent_id IS NOT NULL THEN
                    PERFORM public.create_notification(
                        v_event.id, 'alert.pickup.new_request', v_booking.agent_id, 'pickups', 'high',
                        'New Dispatch Mission! 🚛', 'A pickup request has been assigned to you.',
                        '/jobs', v_event.payload, 'agent'
                    );
                ELSE
                    -- Broadcast to all nearby eligible drivers...
                    v_agents_json := public.get_nearby_agents_dynamic(
                        COALESCE(v_booking.latitude, -1.2635),
                        COALESCE(v_booking.longitude, 36.8048),
                        COALESCE(v_booking.weight_kg, 0)
                    );

                    FOR v_agent IN SELECT * FROM json_array_elements(v_agents_json) LOOP
                        v_agent_id := (v_agent->>'id')::uuid;
                        v_is_eligible := TRUE;
                        v_config := (v_agent->'config')::jsonb;

                        IF jsonb_typeof(v_config) = 'array' AND jsonb_array_length(v_config) > 0 THEN
                            v_config := v_config->0;
                        END IF;

                        IF (v_agent->>'agent_account_type') = 'fleet_driver' AND (v_agent->>'resolved_company_id') IS NOT NULL THEN
                            SELECT config INTO v_config FROM public.profiles WHERE id = (v_agent->>'resolved_company_id')::uuid;
                            IF jsonb_typeof(v_config) = 'array' AND jsonb_array_length(v_config) > 0 THEN
                                v_config := v_config->0;
                            END IF;
                        END IF;

                        v_accepted_materials := v_config->'accepted_materials';
                        IF v_accepted_materials IS NOT NULL AND jsonb_array_length(v_accepted_materials) > 0 THEN
                            IF NOT (v_accepted_materials ? COALESCE(v_booking.waste_type, '')) THEN
                                v_is_eligible := FALSE;
                            END IF;
                        END IF;

                        IF v_is_eligible THEN
                            PERFORM public.create_notification(
                                v_event.id, 'alert.pickup.new_request', v_agent_id, 'pickups', 'high',
                                'New Dispatch Mission! 🚛',
                                'A pickup request for ' || COALESCE(v_booking.weight_kg, 0) || 'kg of ' || COALESCE(v_booking.waste_type, 'material') || ' is available nearby.',
                                '/jobs', v_event.payload, 'agent'
                            );
                        END IF;
                    END LOOP;
                END IF;
            END IF;

        WHEN 'pickup.accepted' THEN
            SELECT user_id INTO v_recipient_id FROM public.bookings WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.pickup.accepted', v_recipient_id, 'pickups', 'high',
                    'Pickup Accepted', 'An agent has accepted your pickup request.',
                    '/pickups/' || v_event.aggregate_id, v_event.payload, 'client'
                );
            END IF;

        WHEN 'pickup.arriving' THEN
            SELECT user_id INTO v_recipient_id FROM public.bookings WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.pickup.arriving', v_recipient_id, 'pickups', 'high',
                    'Agent Arriving', 'Your agent is on the way.',
                    '/pickups/' || v_event.aggregate_id, v_event.payload, 'client'
                );
            END IF;

        WHEN 'pickup.verified' THEN
            SELECT user_id INTO v_recipient_id FROM public.bookings WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.pickup.verified', v_recipient_id, 'pickups', 'normal',
                    'Pickup Verified', 'Your materials have been weighed and verified.',
                    '/pickups/' || v_event.aggregate_id, v_event.payload, 'client'
                );
            END IF;

        WHEN 'pickup.completed' THEN
            SELECT user_id INTO v_recipient_id FROM public.bookings WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.pickup.completed', v_recipient_id, 'pickups', 'normal',
                    'Pickup Completed', 'Thank you for recycling with Klinflow!',
                    '/pickups/' || v_event.aggregate_id, v_event.payload, 'client'
                );
            END IF;

        WHEN 'pickup.cancelled' THEN
            SELECT * INTO v_booking FROM public.bookings WHERE id = v_event.aggregate_id;
            IF v_booking.id IS NOT NULL THEN
                IF v_actor_id = v_booking.agent_id THEN
                    -- Agent cancelled → notify resident
                    PERFORM public.create_notification(
                        v_event.id, 'alert.pickup.cancelled', v_booking.user_id, 'pickups', 'high',
                        'Pickup Cancelled', 'The agent has cancelled the pickup.',
                        '/pickups/' || v_event.aggregate_id, v_event.payload, 'client'
                    );
                ELSIF v_actor_id = v_booking.user_id AND v_booking.agent_id IS NOT NULL THEN
                    -- Resident cancelled → notify agent
                    PERFORM public.create_notification(
                        v_event.id, 'alert.pickup.cancelled', v_booking.agent_id, 'pickups', 'high',
                        'Pickup Cancelled', 'The resident has cancelled the pickup.',
                        '/jobs', v_event.payload, 'agent'
                    );
                END IF;
            END IF;

        -- ── MARKETPLACE DOMAIN ─────────────────────────────────────

        WHEN 'trade.created' THEN
            -- Direct requests: notify the targeted agent immediately
            SELECT target_agent_id, pickup_mode, material, quantity, seller_id
            INTO v_listing
            FROM public.marketplace_listings WHERE id = v_event.aggregate_id;

            IF v_listing.seller_id IS NOT NULL AND v_listing.target_agent_id IS NOT NULL THEN
                -- Fetch seller name for a richer notification body
                SELECT name INTO v_seller_name FROM public.profiles WHERE id = v_listing.seller_id;

                IF COALESCE(v_listing.pickup_mode, 'pickup') = 'dropoff' THEN
                    PERFORM public.create_notification(
                        v_event.id, 'alert.trade.direct_dropoff', v_listing.target_agent_id, 'marketplace', 'high',
                        'New Direct Drop-off Incoming! 📦',
                        COALESCE(v_seller_name, 'A seller') || ' is bringing ' || COALESCE(v_listing.quantity::text, '') || 'kg of ' || COALESCE(v_listing.material, 'material') || ' to you.',
                        '/sourcing', v_event.payload, 'agent'
                    );
                ELSE
                    PERFORM public.create_notification(
                        v_event.id, 'alert.trade.direct_pickup', v_listing.target_agent_id, 'marketplace', 'high',
                        'New Direct Pickup Request! 🚛',
                        COALESCE(v_seller_name, 'A seller') || ' needs you to collect ' || COALESCE(v_listing.quantity::text, '') || 'kg of ' || COALESCE(v_listing.material, 'material') || '.',
                        '/sourcing', v_event.payload, 'agent'
                    );
                END IF;
            END IF;

        -- ══════════════════════════════════════════════════════════════
        -- FIX: offer.created / offer.accepted / offer.rejected
        -- ══════════════════════════════════════════════════════════════

        WHEN 'offer.created' THEN
            -- Agent made an offer on a listing → notify the SELLER
            SELECT * INTO v_offer FROM public.marketplace_offers WHERE id = v_event.aggregate_id;
            
            IF v_offer.id IS NOT NULL AND v_offer.seller_id IS NOT NULL THEN
                -- Fetch buyer name for richer notification
                SELECT name INTO v_buyer_name FROM public.profiles WHERE id = v_offer.buyer_id;

                PERFORM public.create_notification(
                    v_event.id, 'alert.trade.offer_received', v_offer.seller_id, 'marketplace', 'high',
                    'New Offer on Your Listing! 🤝',
                    COALESCE(v_buyer_name, 'An agent') || ' offered KSh ' || COALESCE(v_offer.offered_price::text, '0') || '/kg for your material.',
                    '/my-trades', v_event.payload, 'client'
                );
            END IF;

        WHEN 'offer.accepted' THEN
            -- Seller accepted the offer → notify the BUYER (agent)
            SELECT * INTO v_offer FROM public.marketplace_offers WHERE id = v_event.aggregate_id;
            
            IF v_offer.id IS NOT NULL AND v_offer.buyer_id IS NOT NULL THEN
                -- Fetch seller name for richer notification
                SELECT name INTO v_seller_name FROM public.profiles WHERE id = v_offer.seller_id;

                PERFORM public.create_notification(
                    v_event.id, 'alert.trade.offer_accepted', v_offer.buyer_id, 'marketplace', 'high',
                    'Your Offer Was Accepted! ✅',
                    COALESCE(v_seller_name, 'A seller') || ' accepted your offer. A pickup has been scheduled.',
                    '/bids', v_event.payload, 'agent'
                );
            END IF;

        WHEN 'offer.rejected' THEN
            -- Seller rejected the offer → notify the BUYER (agent)
            SELECT * INTO v_offer FROM public.marketplace_offers WHERE id = v_event.aggregate_id;
            
            IF v_offer.id IS NOT NULL AND v_offer.buyer_id IS NOT NULL THEN
                -- Fetch seller name for richer notification
                SELECT name INTO v_seller_name FROM public.profiles WHERE id = v_offer.seller_id;

                PERFORM public.create_notification(
                    v_event.id, 'alert.trade.offer_rejected', v_offer.buyer_id, 'marketplace', 'normal',
                    'Offer Rejected ❌',
                    COALESCE(v_seller_name, 'The seller') || ' rejected your offer. The material is back on the market, you can bid again.',
                    '/bids', v_event.payload, 'agent'
                );
            END IF;

        -- ── FLEET DOMAIN ───────────────────────────────────────────

        WHEN 'fleet.invite_requested' THEN
            SELECT company_id INTO v_recipient_id FROM public.company_join_requests WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.fleet.invite_requested', v_recipient_id, 'system', 'normal',
                    'New Fleet Request', 'A driver has requested to join your fleet.',
                    '/fleet/requests', v_event.payload, 'hub'
                );
            END IF;

        WHEN 'fleet.invite_approved' THEN
            SELECT driver_id INTO v_recipient_id FROM public.company_join_requests WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.fleet.invite_approved', v_recipient_id, 'system', 'normal',
                    'Request Approved', 'Your request to join the fleet has been approved.',
                    '/', v_event.payload, 'agent'
                );
            END IF;

        -- ── WALLET DOMAIN ──────────────────────────────────────────

        WHEN 'wallet.payout' THEN
            SELECT profile_id INTO v_recipient_id FROM public.wallet_transactions WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                v_amount := (v_event.payload->>'amount')::numeric;
                v_type := v_event.payload->'metadata'->>'type';

                v_title := 'Payment Received! 💰';
                v_body := 'You just received KES ' || trim(to_char(ABS(COALESCE(v_amount, 0)), '999,999,999.00')) || ' in your Klinflow Wallet.';

                IF v_type = 'rfq_buyback' THEN
                    v_title := 'RFQ Payment Received! 💰';
                    v_body := 'You just received KES ' || trim(to_char(ABS(COALESCE(v_amount, 0)), '999,999,999.00')) || ' for your RFQ delivery.';
                ELSIF v_type = 'swarm_split' THEN
                    v_title := 'Bulk Drive Payout! 💰';
                    v_body := 'Your community bulk drive completed. KES ' || trim(to_char(ABS(COALESCE(v_amount, 0)), '999,999,999.00')) || ' has been added to your wallet.';
                ELSIF v_type = 'pure_trade' THEN
                    v_title := 'Trade Payment Received! 💰';
                END IF;

                -- Dynamic: Determine target app from recipient's role
                SELECT role INTO v_recipient_role FROM public.profiles WHERE id = v_recipient_id;

                PERFORM public.create_notification(
                    v_event.id, 'alert.wallet.payment_received', v_recipient_id, 'earnings', 'high',
                    v_title, v_body,
                    '/wallet', v_event.payload,
                    CASE WHEN v_recipient_role = 'agent' THEN 'agent' ELSE 'client' END
                );
            END IF;

        WHEN 'wallet.fund_request' THEN
            SELECT company_id INTO v_recipient_id FROM public.fund_requests WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.wallet.fund_request', v_recipient_id, 'earnings', 'high',
                    'Fund Request', 'A driver has requested funds.',
                    '/wallet', v_event.payload, 'hub'
                );
            END IF;

        WHEN 'wallet.fund_approved' THEN
            v_recipient_id := (v_event.payload->>'driver_id')::uuid;
            IF v_recipient_id IS NOT NULL THEN
                v_amount := (v_event.payload->>'amount')::numeric;
                PERFORM public.create_notification(
                    v_event.id, 'alert.wallet.fund_approved', v_recipient_id, 'earnings', 'high',
                    '💰 Funds Approved', 'Your request for KES ' || trim(to_char(COALESCE(v_amount, 0), '999,999,999')) || ' has been approved and disbursed to your wallet.',
                    '/wallet', v_event.payload, 'agent'
                );
            END IF;

        WHEN 'wallet.fund_declined' THEN
            v_recipient_id := (v_event.payload->>'driver_id')::uuid;
            IF v_recipient_id IS NOT NULL THEN
                v_amount := (v_event.payload->>'amount')::numeric;
                PERFORM public.create_notification(
                    v_event.id, 'alert.wallet.fund_declined', v_recipient_id, 'earnings', 'normal',
                    '❌ Request Declined', 'Your request for KES ' || trim(to_char(COALESCE(v_amount, 0), '999,999,999')) || ' was declined by the company owner.',
                    '/wallet', v_event.payload, 'agent'
                );
            END IF;

        WHEN 'wallet.topup' THEN
            SELECT role INTO v_recipient_role FROM public.profiles WHERE id = v_actor_id;
            PERFORM public.create_notification(
                v_event.id, 'alert.wallet.topup', v_actor_id, 'earnings', 'high',
                'Deposit Successful! 💰', 'You successfully topped up KES ' || trim(to_char(ABS(COALESCE((v_event.payload->>'amount')::numeric, 0)), '999,999,999.00')) || '.',
                '/wallet', v_event.payload,
                CASE WHEN v_recipient_role = 'agent' THEN 'agent' ELSE 'client' END
            );

        WHEN 'wallet.withdrawal' THEN
            SELECT role INTO v_recipient_role FROM public.profiles WHERE id = v_actor_id;
            PERFORM public.create_notification(
                v_event.id, 'alert.wallet.withdrawal', v_actor_id, 'earnings', 'high',
                'Withdrawal Initiated 💸', 'Your withdrawal of KES ' || trim(to_char(ABS(COALESCE((v_event.payload->>'amount')::numeric, 0)), '999,999,999.00')) || ' is being processed.',
                '/wallet', v_event.payload,
                CASE WHEN v_recipient_role = 'agent' THEN 'agent' ELSE 'client' END
            );

        WHEN 'wallet.transfer_sent' THEN
            SELECT role INTO v_recipient_role FROM public.profiles WHERE id = v_actor_id;
            PERFORM public.create_notification(
                v_event.id, 'alert.wallet.transfer_sent', v_actor_id, 'earnings', 'normal',
                'Transfer Successful', 'You successfully sent ' || (v_event.payload->>'amount') || ' points. Ref: ' || (v_event.payload->>'ref'),
                '/wallet', v_event.payload,
                CASE WHEN v_recipient_role = 'agent' THEN 'agent' ELSE 'client' END
            );

        WHEN 'wallet.transfer_received' THEN
            v_recipient_id := (v_event.payload->>'receiver_id')::uuid;
            SELECT role INTO v_recipient_role FROM public.profiles WHERE id = v_recipient_id;
            PERFORM public.create_notification(
                v_event.id, 'alert.wallet.transfer_received', v_recipient_id, 'earnings', 'high',
                'Points Received!', 'You received ' || (v_event.payload->>'amount') || ' points. Ref: ' || (v_event.payload->>'ref'),
                '/wallet', v_event.payload,
                CASE WHEN v_recipient_role = 'agent' THEN 'agent' ELSE 'client' END
            );

        WHEN 'reward.refund' THEN
            PERFORM public.create_notification(
                v_event.id, 'alert.reward.refund', v_actor_id, 'earnings', 'normal',
                'Redemption Failed — Points Refunded', 'Your redemption failed. ' || (v_event.payload->>'amount') || ' points have been refunded to your wallet.',
                '/wallet', v_event.payload, 'client'
            );

        WHEN 'reward.redeemed' THEN
            PERFORM public.create_notification(
                v_event.id, 'alert.reward.redeemed', v_actor_id, 'rewards', 'normal',
                'Reward Redeemed', 'Your point redemption was successful.',
                '/wallet/rewards', v_event.payload, 'client'
            );

        WHEN 'rfq.offer_created' THEN
            SELECT buyer_id INTO v_recipient_id FROM public.rfq_offers WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.rfq.offer_received', v_recipient_id, 'marketplace', 'high',
                    'New RFQ Bid', 'A seller has placed a bid on your RFQ.',
                    '/rfqs', v_event.payload, 'client'
                );
            END IF;

        WHEN 'agent.verified' THEN
            PERFORM public.create_notification(
                v_event.id, 'alert.account.verified', v_event.aggregate_id, 'account', 'critical',
                'Account Verified', 'Your account has been officially verified!',
                '/profile', v_event.payload, 'agent'
            );

        WHEN 'order.created' THEN
            SELECT seller_id INTO v_recipient_id FROM public.marketplace_orders WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.marketplace.order_received', v_recipient_id, 'business', 'high',
                    'New Order Received', 'A buyer wants to purchase your material.',
                    '/business/orders', v_event.payload, 'client'
                );
            END IF;

        WHEN 'order.completed' THEN
            SELECT seller_id INTO v_recipient_id FROM public.marketplace_orders WHERE id = v_event.aggregate_id;
            IF v_recipient_id IS NOT NULL THEN
                PERFORM public.create_notification(
                    v_event.id, 'alert.marketplace.escrow_released', v_recipient_id, 'business', 'high',
                    'Payment Released', 'Funds for your order have been credited.',
                    '/wallet', v_event.payload, 'client'
                );
            END IF;

        WHEN 'verification_request.submitted' THEN
            FOR v_recipient_id IN (SELECT id FROM public.profiles WHERE role = 'admin' OR role = 'superadmin') LOOP
                PERFORM public.create_notification(
                    v_event.id, 'alert.security.verification_requested', v_recipient_id, 'security', 'high',
                    'Verification Request', 'A seller is requesting identity verification.',
                    '/admin/verifications', v_event.payload, 'admin'
                );
            END LOOP;

        ELSE
            NULL;
    END CASE;
END;
$$;
