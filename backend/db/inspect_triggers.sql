-- Inspect triggers in the public schema
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM
    information_schema.triggers
WHERE
    event_object_schema = 'public';

-- Inspect triggers specifically on auth.users if possible
-- Note: Some environments might restrict access to information_schema for the 'auth' schema
-- but let's try if it gives us any clues about what happens on signup.
