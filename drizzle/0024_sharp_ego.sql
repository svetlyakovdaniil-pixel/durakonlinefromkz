CREATE TABLE `player_complaints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterProfileId` int NOT NULL,
	`targetProfileId` int NOT NULL,
	`reason` enum('cheating','toxic_behavior','inappropriate_name','afk_abuse','other') NOT NULL,
	`description` text,
	`complaint_status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`adminNote` text,
	`action_taken` enum('none','warning','temp_ban','permanent_ban'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_complaints_id` PRIMARY KEY(`id`)
);
