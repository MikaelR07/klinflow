SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck 
FROM pg_policy pol 
JOIN pg_class tbl ON pol.polrelid = tbl.oid 
JOIN pg_namespace nsp ON tbl.relnamespace = nsp.oid 
WHERE nsp.nspname = 'storage' AND tbl.relname = 'objects';
