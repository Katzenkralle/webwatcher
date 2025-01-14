CREATE TABLE IF NOT EXISTS web_users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    isAdmin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS script_list (
    fs_path VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);
CREATE TABLE IF NOT EXISTS script_input_info (
    script_name VARCHAR(255) NOT NULL,
    keyword VARCHAR(64) NOT NULL,
    datatype VARCHAR(255),
    PRIMARY KEY (script_name, keyword),
    FOREIGN KEY (script_name) REFERENCES script_list(name) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS job_list (
    script_name VARCHAR(255) NOT NULL,
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    description TEXT,
    expected_return_schema JSON,
    dynamic_schema BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (script_name) REFERENCES script_list(name) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS cron_list (
    job_id INT PRIMARY KEY,
    cron_time INT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (job_id) REFERENCES job_list(job_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS job_input_settings (
    job_id INT NOT NULL,
    keyword VARCHAR(64) NOT NULL,
    value TEXT,
    FOREIGN KEY (job_id) REFERENCES job_list(job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (job_id, keyword)
);




