CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileId` int NOT NULL,
	`type` enum('free_topup','buy_shanyrak','buy_tenge','game_reward') NOT NULL,
	`amount` int NOT NULL,
	`currency` enum('tenge','shanyrak') NOT NULL,
	`description` text,
	`balanceAfter` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('friend_request','friend_accepted','balance_topup','cooldown_expired') NOT NULL;