import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_settings_page_s_e_o_path" AS ENUM('/', '/booking', '/dokter', '/lokasi', '/layanan', '/blog', '/berita', '/kontak', '/links');
  CREATE TABLE "doctors_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_doctors_v_version_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "locations_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_locations_v_version_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "services_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_services_v_version_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "articles_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_articles_v_version_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "news_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_news_v_version_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "pages_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_pages_v_version_sections_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "settings_page_s_e_o" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" "enum_settings_page_s_e_o_path" NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"canonical" varchar,
  	"noindex" boolean,
  	"image_id" integer
  );
  
  ALTER TABLE "doctors_sections_links" ADD CONSTRAINT "doctors_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctors_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_doctors_v_version_sections_links" ADD CONSTRAINT "_doctors_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_doctors_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_sections_links" ADD CONSTRAINT "locations_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_sections_links" ADD CONSTRAINT "_locations_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_sections_links" ADD CONSTRAINT "services_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_sections_links" ADD CONSTRAINT "_services_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_sections_links" ADD CONSTRAINT "articles_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articles_v_version_sections_links" ADD CONSTRAINT "_articles_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_articles_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_sections_links" ADD CONSTRAINT "news_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_v_version_sections_links" ADD CONSTRAINT "_news_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_sections_links" ADD CONSTRAINT "pages_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sections_links" ADD CONSTRAINT "_pages_v_version_sections_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_page_s_e_o" ADD CONSTRAINT "settings_page_s_e_o_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "settings_page_s_e_o" ADD CONSTRAINT "settings_page_s_e_o_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "doctors_sections_links_order_idx" ON "doctors_sections_links" USING btree ("_order");
  CREATE INDEX "doctors_sections_links_parent_id_idx" ON "doctors_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_doctors_v_version_sections_links_order_idx" ON "_doctors_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_doctors_v_version_sections_links_parent_id_idx" ON "_doctors_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "locations_sections_links_order_idx" ON "locations_sections_links" USING btree ("_order");
  CREATE INDEX "locations_sections_links_parent_id_idx" ON "locations_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_sections_links_order_idx" ON "_locations_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_locations_v_version_sections_links_parent_id_idx" ON "_locations_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "services_sections_links_order_idx" ON "services_sections_links" USING btree ("_order");
  CREATE INDEX "services_sections_links_parent_id_idx" ON "services_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_sections_links_order_idx" ON "_services_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_services_v_version_sections_links_parent_id_idx" ON "_services_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "articles_sections_links_order_idx" ON "articles_sections_links" USING btree ("_order");
  CREATE INDEX "articles_sections_links_parent_id_idx" ON "articles_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_version_sections_links_order_idx" ON "_articles_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_articles_v_version_sections_links_parent_id_idx" ON "_articles_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "news_sections_links_order_idx" ON "news_sections_links" USING btree ("_order");
  CREATE INDEX "news_sections_links_parent_id_idx" ON "news_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_news_v_version_sections_links_order_idx" ON "_news_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_news_v_version_sections_links_parent_id_idx" ON "_news_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "pages_sections_links_order_idx" ON "pages_sections_links" USING btree ("_order");
  CREATE INDEX "pages_sections_links_parent_id_idx" ON "pages_sections_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_sections_links_order_idx" ON "_pages_v_version_sections_links" USING btree ("_order");
  CREATE INDEX "_pages_v_version_sections_links_parent_id_idx" ON "_pages_v_version_sections_links" USING btree ("_parent_id");
  CREATE INDEX "settings_page_s_e_o_order_idx" ON "settings_page_s_e_o" USING btree ("_order");
  CREATE INDEX "settings_page_s_e_o_parent_id_idx" ON "settings_page_s_e_o" USING btree ("_parent_id");
  CREATE INDEX "settings_page_s_e_o_image_idx" ON "settings_page_s_e_o" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "doctors_sections_links" CASCADE;
  DROP TABLE "_doctors_v_version_sections_links" CASCADE;
  DROP TABLE "locations_sections_links" CASCADE;
  DROP TABLE "_locations_v_version_sections_links" CASCADE;
  DROP TABLE "services_sections_links" CASCADE;
  DROP TABLE "_services_v_version_sections_links" CASCADE;
  DROP TABLE "articles_sections_links" CASCADE;
  DROP TABLE "_articles_v_version_sections_links" CASCADE;
  DROP TABLE "news_sections_links" CASCADE;
  DROP TABLE "_news_v_version_sections_links" CASCADE;
  DROP TABLE "pages_sections_links" CASCADE;
  DROP TABLE "_pages_v_version_sections_links" CASCADE;
  DROP TABLE "settings_page_s_e_o" CASCADE;
  DROP TYPE "public"."enum_settings_page_s_e_o_path";`)
}
