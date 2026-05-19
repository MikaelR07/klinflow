-- ============================================================
-- CleanFlow Rewards & Ratings Reset Script
-- Clears GFP (reward points) and Ratings for users and agents
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

BEGIN;

-- 1. Clear GFP (reward_points) for clients
UPDATE public.profiles 
SET reward_points = 0 
WHERE role = 'user';

-- 2. Clear reward points for agents
UPDATE public.profiles 
SET reward_points = 0 
WHERE role = 'agent';

-- 3. Clear ratings from agents (Reset to default 5.00)
UPDATE public.profiles 
SET rating = 5.00 
WHERE role = 'agent';

-- 4. Clear individual agent reviews/ratings on bookings
UPDATE public.bookings 
SET agent_rating = NULL, 
    agent_feedback = NULL;

COMMIT;

-- Verification query
SELECT role, COUNT(*) as count, SUM(reward_points) AS total_reward_points, AVG(rating) AS average_rating 
FROM public.profiles 
GROUP BY role;
