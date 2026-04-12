ALTER TABLE `player_profiles` ADD `isPremium` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `premiumExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `dailyQuestSwapsUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `lastQuestSwapDate` varchar(10);