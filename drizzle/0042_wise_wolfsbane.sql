ALTER TABLE `player_profiles` ADD `tutorialCompletedCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `premiumPurchaseCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `premiumConsecutiveMonths` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `lastPremiumPurchaseMonth` varchar(7);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `dailyQuestsCompleted` int DEFAULT 0 NOT NULL;