CREATE TABLE "merchant_settings" (
	"merchant_id" uuid PRIMARY KEY NOT NULL,
	"default_token_address" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchant_settings" ADD CONSTRAINT "merchant_settings_merchant_id_user_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;