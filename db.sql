-- This is the code I used in the MySQL shell to create the database, tables and relevant functions. 

-- Create the database for the note-taking app
CREATE DATABASE notesapp;

-- Create users table for authentication
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    salt VARCHAR(50) NOT NULL
);

-- Create notes table
CREATE TABLE notes (
    note_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    title VARCHAR(100) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create tags table for categorizing notes
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name VARCHAR(50) UNIQUE NOT NULL
);

-- Create a junction table to associate notes with tags (many-to-many relationship)
CREATE TABLE note_tags (
    note_id INT REFERENCES notes(note_id),
    tag_id INT REFERENCES tags(tag_id),
    PRIMARY KEY (note_id, tag_id)
);

-- Create sessions table for user sessions and tokens (for JWT, OAuth, etc.)
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    token VARCHAR(500) UNIQUE NOT NULL,
    expiry_timestamp TIMESTAMP NOT NULL
);

-- Create a function to generate a random salt
CREATE OR REPLACE FUNCTION generate_salt(length INT)
RETURNS VARCHAR(50) AS $$
DECLARE
    characters VARCHAR(62) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    salt VARCHAR(50) := '';
BEGIN
    FOR i IN 1..length LOOP
        salt := salt || substr(characters, floor(random() * 62) + 1, 1);
    END LOOP;
    RETURN salt;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate salt for new users
CREATE TRIGGER generate_salt_trigger
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    NEW.salt := generate_salt(16);
END;

-- Create a function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password VARCHAR, salt VARCHAR)
RETURNS VARCHAR(100) AS $$
BEGIN
    RETURN crypt(password, salt);
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to hash passwords before inserting new users
CREATE TRIGGER hash_password_trigger
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    NEW.password_hash := hash_password(NEW.password_hash, NEW.salt);
END;

-- Create a function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(input_password VARCHAR, stored_hash VARCHAR, salt VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN stored_hash = hash_password(input_password, salt);
END;
$$ LANGUAGE plpgsql;

-- Create an index on the username for faster user lookup
CREATE INDEX idx_username ON users(username);

-- Create an index on the tag_name for faster tag lookup
CREATE INDEX idx_tag_name ON tags(tag_name);

-- Create an index on the created_at field for faster note retrieval
CREATE INDEX idx_created_at ON notes(created_at);

-- Create a function to add tags to notes
CREATE OR REPLACE FUNCTION add_tags_to_note(note_id INT, tag_names VARCHAR[])
RETURNS VOID AS $$
BEGIN
    DELETE FROM note_tags WHERE note_id = $1;
    INSERT INTO note_tags (note_id, tag_id)
    SELECT $1, tag_id
    FROM tags
    WHERE tag_name = ANY($2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to remove tags from notes
CREATE OR REPLACE FUNCTION remove_tags_from_note(note_id INT, tag_names VARCHAR[])
RETURNS VOID AS $$
BEGIN
    DELETE FROM note_tags
    WHERE note_id = $1
    AND tag_id IN (SELECT tag_id FROM tags WHERE tag_name = ANY($2));
END;
$$ LANGUAGE plpgsql;
