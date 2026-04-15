CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredId_unique` UNIQUE(`referredId`)
);
--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `referralCode` varchar(8);--> statement-breakpoint
ALTER TABLE `player_profiles` ADD `referralRewardLevel` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `player_profiles` ADD CONSTRAINT `player_profiles_referralCode_unique` UNIQUE(`referralCode`);