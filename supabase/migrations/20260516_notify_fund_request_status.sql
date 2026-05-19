-- Migration: notify_fund_request_status.sql
-- Description: Automatically notifies drivers when their fund requests are approved or rejected.

CREATE OR REPLACE FUNCTION public.handle_fund_request_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if status has changed and is not pending
    IF (OLD.status = 'pending' AND NEW.status != 'pending') THEN
        INSERT INTO public.notifications (
            target_user, 
            target_role, 
            type, 
            title, 
            body
        ) VALUES (
            NEW.driver_id,
            'agent',
            'system',
            CASE 
                WHEN NEW.status = 'approved' THEN '💰 Funds Approved'
                ELSE '❌ Request Declined'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Your request for KSh ' || trim(to_char(NEW.amount, '999,999,999')) || ' has been approved and disbursed to your wallet.'
                ELSE 'Your request for KSh ' || trim(to_char(NEW.amount, '999,999,999')) || ' was declined by the company owner.'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_fund_status ON public.fund_requests;
CREATE TRIGGER trigger_notify_fund_status
    AFTER UPDATE ON public.fund_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_fund_request_notification();
