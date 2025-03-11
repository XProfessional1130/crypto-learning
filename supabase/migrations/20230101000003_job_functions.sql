-- Create a function to get pending job counts by job type
CREATE OR REPLACE FUNCTION get_pending_job_counts()
RETURNS TABLE (job_type text, count bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT job_type, COUNT(*) as count
  FROM background_jobs
  WHERE status = 'pending'
  GROUP BY job_type;
$$; 