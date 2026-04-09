CREATE TABLE `music_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` int NOT NULL DEFAULT 0,
	`isDefault` boolean NOT NULL DEFAULT false,
	`tracksJson` text NOT NULL,
	`previewTrackUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `music_playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `owned_music_playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`playlistId` int NOT NULL,
	`acquiredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owned_music_playlists_id` PRIMARY KEY(`id`)
);
