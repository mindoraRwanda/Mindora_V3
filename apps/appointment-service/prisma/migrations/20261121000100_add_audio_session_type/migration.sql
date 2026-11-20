-- Add AUDIO without removing existing IN_PERSON/CHAT values or touching appointment rows.
ALTER TYPE "SessionType" ADD VALUE IF NOT EXISTS 'AUDIO';
