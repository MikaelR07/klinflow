SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'complete_booking_split_payout';
