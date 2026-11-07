ALTER TABLE "orders" ADD COLUMN "merchant_address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expires_at" timestamp (0) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fee_bps" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "signature" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "settled_at" timestamp;