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
    'Weather Belin',
    'This watcher retrieves the current weather in Berlin.',
    TRUE
);
INSERT INTO cron_list (job_id, cron_time, executed_last, enabled)
VALUES (
    2,
    '0 */2 * * *',
    0,
    TRUE
);

INSERT INTO job_list (script_name, job_name, description, dynamic_schema, expected_return_schema)
VALUES (
    'HTTP-Status Watcher',
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

