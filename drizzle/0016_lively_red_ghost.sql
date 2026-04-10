ALTER TABLE `player_profiles` ADD `isBanned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `banReason` text;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `bannedAt` timestamp;