ALTER TABLE `player_profiles` ADD `ownedEmotionPacks` text;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `activeEmotionPack` varchar(32) DEFAULT 'hamster';