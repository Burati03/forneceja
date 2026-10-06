CREATE OR REPLACE FUNCTION public.resolve_login_email(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH normalized AS (
  SELECT regexp_replace(_phone, '\D', '') AS digits
),
normalized_phone AS (
  SELECT CASE
    WHEN length(digits) = 10 THEN '55' || digits
    WHEN length(digits) = 11 AND digits NOT LIKE '55%' THEN '55' || digits
    ELSE digits
  END AS phone
  FROM normalized
),
normalized_stored_phone AS (
  SELECT CASE
    WHEN length(regexp_replace(pp.telefone, '\D', '')) = 10 THEN '55' || regexp_replace(pp.telefone, '\D', '')
    WHEN length(regexp_replace(pp.telefone, '\D', '')) = 11 AND regexp_replace(pp.telefone, '\D', '') NOT LIKE '55%' THEN '55' || regexp_replace(pp.telefone, '\D', '')
    ELSE regexp_replace(pp.telefone, '\D', '')
  END AS phone
  FROM public.profiles_private AS pp
)
SELECT p.email
FROM public.profiles AS p
JOIN public.profiles_private AS pp ON pp.id = p.id
CROSS JOIN normalized_phone AS np
CROSS JOIN normalized_stored_phone AS sp
WHERE np.phone = sp.phone
  AND p.email IS NOT NULL
LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_email(text) TO authenticated;
