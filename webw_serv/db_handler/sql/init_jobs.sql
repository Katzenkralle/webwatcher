INSERT INTO job_list (script_name, job_name, description, dynamic_schema)
VALUES (
    'Sensor Watcher',
    'Device State',
    'This watcher retrieves the current sensor data from all sensors found on the device.',
    TRUE
);

INSERT INTO cron_list (job_id, cron_time, executed_last, enabled)
VALUES (
    1,
    '0 * * * *',
    0,
    TRUE
);

INSERT INTO job_list (script_name, job_name, description, dynamic_schema)
VALUES (
    'Weather Watcher',
    'Weather Bremen',
    'This watcher retrieves the current weather in Bremen.',
    TRUE
);
INSERT INTO cron_list (job_id, cron_time, executed_last, enabled)
VALUES (
    2,
    '5,35 * * * *',
    0,
    TRUE
);

INSERT INTO job_input_settings (job_id, keyword, value)
VALUES (
    2,
    'lon',
    '53.44'   
);

INSERT INTO job_input_settings (job_id, keyword, value)
VALUES (
    2,
    'lat',
    '8.48'   
);

INSERT INTO job_list (script_name, job_name, description, dynamic_schema, expected_return_schema)
VALUES (
    'Basic HTTP Watcher',
    'GitHub Status',
    'Retrives the current Status of https://github.com/',
    FALSE,
    '{"url": "str", "status_code": "int", "description": "str", "encoding": "str", "http_version": "str"}'
);
INSERT INTO cron_list (job_id, cron_time, executed_last, enabled)
VALUES (
    3,
    '0 0 * * *',
    0,
    TRUE
);

INSERT INTO job_input_settings (job_id, keyword, value)
VALUES (
    3,
    'url',
    'https://github.com/'   
);

INSERT INTO job_list (script_name, job_name, description, dynamic_schema, expected_return_schema)
VALUES (
    'Basic HTTP Watcher',
    'Joke of the Day',
    'Fetches a new joke every day from the JokeAPI.',
    FALSE,
    '{"url": "str", "status_code": "int", "description": "str", "encoding": "str", "http_version": "str", "body": "str"}'
);
INSERT INTO cron_list (job_id, cron_time, executed_last, enabled)
VALUES (
    4,
    '0 0 * * *',
    0,
    TRUE
);

INSERT INTO job_input_settings (job_id, keyword, value)
VALUES (
    4,
    'url',
    'https://v2.jokeapi.dev/joke/Programming,Miscellaneous,Dark,Pun,Spooky,Christmas?format=txt'   
);

INSERT INTO job_input_settings (job_id, keyword, value)
VALUES (
    4,
    'include_body',
    'True'   
);