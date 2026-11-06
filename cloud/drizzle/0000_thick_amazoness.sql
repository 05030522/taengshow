CREATE TABLE `archive` (
	`id` integer PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`body` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`revision` integer NOT NULL,
	`body` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`size` integer NOT NULL,
	`type` text NOT NULL
);
