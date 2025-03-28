CREATE TABLE IF NOT EXISTS web_users
(
    username VARCHAR(255),
    password VARCHAR(256) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS web_user_sessions (
    username VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    expiration TIMESTAMP,
    FOREIGN KEY (username) REFERENCES web_users (username) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (username, session_id)
);

CREATE TABLE IF NOT EXISTS script_list
(
    fs_path                VARCHAR(255),
    name                   VARCHAR(255) NOT NULL UNIQUE,
    description            TEXT,
    expected_return_schema JSON,
    PRIMARY KEY (fs_path)
);
CREATE TABLE IF NOT EXISTS script_input_info
(
    script_name VARCHAR(255) NOT NULL,
    keyword     VARCHAR(64)  NOT NULL,
    datatype    VARCHAR(255),
    FOREIGN KEY (script_name) REFERENCES script_list (name) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (script_name, keyword)
);

CREATE TABLE IF NOT EXISTS job_list
(
    script_name    VARCHAR(255) NOT NULL,
    job_id         INT AUTO_INCREMENT,
    job_name       VARCHAR(255) NOT NULL,
    description    TEXT,
    dynamic_schema BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (script_name) REFERENCES script_list (name) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (job_id)
);

CREATE TABLE IF NOT EXISTS job_display_user_config
(
    username      VARCHAR(255),
    job_id        INT,
    filter_config JSON,
    graph_config  JSON,
    FOREIGN KEY (username) REFERENCES web_users (username) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (job_id) REFERENCES job_list (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (username, job_id)
);

CREATE TABLE IF NOT EXISTS cron_list
(
    job_id        INT,
    cron_time     INT     NOT NULL,
    executed_last TIMESTAMP,
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (job_id) REFERENCES job_list (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (job_id)
);

CREATE TABLE IF NOT EXISTS job_input_settings
(
    job_id  INT         NOT NULL,
    keyword VARCHAR(64) NOT NULL,
    value   TEXT,
    FOREIGN KEY (job_id) REFERENCES job_list (job_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (job_id, keyword)
);



