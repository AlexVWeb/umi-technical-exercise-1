-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  title text,
  body text,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.favorites_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid,
  user_id uuid,
  CONSTRAINT favorites_articles_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_articles_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles(id),
  CONSTRAINT favorites_articles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  firstname character varying,
  lastname character varying,
  email character varying UNIQUE,
  password text,
  salt text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);