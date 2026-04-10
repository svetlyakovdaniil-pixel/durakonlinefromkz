CREATE TABLE `music_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameKk` varchar(100),
	`tracksJson` text NOT NULL,
	`priceShanyrak` int NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`description` text,
	`descriptionKk` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `music_playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `ownedPlaylists` text;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `activePlaylistId` int;