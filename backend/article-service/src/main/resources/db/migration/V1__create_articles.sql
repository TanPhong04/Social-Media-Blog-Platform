CREATE TABLE articles (
 id UUID PRIMARY KEY, author_id UUID NOT NULL, title VARCHAR(200) NOT NULL, slug VARCHAR(240) NOT NULL UNIQUE,
 summary VARCHAR(500), content TEXT NOT NULL, status VARCHAR(20) NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL,
 updated_at TIMESTAMP WITH TIME ZONE NOT NULL, published_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_articles_status_published ON articles(status,published_at DESC);
CREATE INDEX idx_articles_author ON articles(author_id,created_at DESC);
CREATE TABLE article_tags(article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,tag VARCHAR(50) NOT NULL,PRIMARY KEY(article_id,tag));
