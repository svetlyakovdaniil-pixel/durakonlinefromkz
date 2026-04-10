ALTER TABLE `game_history` ADD `hasBots` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `botGamesPlayed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `botWins` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `botLosses` int DEFAULT 0 NOT NULL;