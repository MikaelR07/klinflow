SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'client_releases_funds';
