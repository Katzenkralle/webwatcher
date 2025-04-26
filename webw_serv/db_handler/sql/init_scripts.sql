
INSERT INTO script_list (fs_path, name, description, temporary, supports_static_schema)
VALUES (
    './webw_serv_scripts_store/scripts/basic_http.py',
    'Basic HTTP Watcher',
    'This watcher checks the HTTP status of a given URL and returns the status code.\nArguments:\n- url: The URL to check (string).\n- include_body: Whether to include the body of the response (True|False).',
    FALSE,
    TRUE
);


INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Basic HTTP Watcher',
    'url',
    'str'
);
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Basic HTTP Watcher',
    'include_body',
    'bool'
);




INSERT INTO script_list (fs_path, name, description, temporary)
VALUES (
    './webw_serv_scripts_store/scripts/device_sensors.py',
    'Sensor Watcher',
    'This watcher retrieves the status of sensors on the device.\nArguments:\n- ignore_chips: A list of chips to ignore (list of strings). E.g.: acpitz,x86_pkg_temp\n- ignore_sensors: A list of sensors to ignore (list of strings). E.g.: cpu0,cpu1',
    FALSE
);

INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Sensor Watcher',
    'ignore_chips',
    'str'
);

INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Sensor Watcher',
    'ignore_sensors',
    'str'
);

INSERT INTO script_list (fs_path, name, description, temporary)
VALUES (
    './webw_serv_scripts_store/scripts/weather.py',
    'Weather Watcher',
    'This watcher retrieves the current weather information for a given location (default Berlin).\nArguments:    \n- lat: "float" # Latitude of the location, default is Berlin\n- lon: "float" # Longitude of the location, default is Berlin\n- timezone: "str" # Timezone of the location, default is Europe/Berlin\n- mode: "str" # Mode of the query, can be "hourly", "daily" or "current", default is "current"\n- future: "int" # Future time, unit depends on the mode, either hours or days, default is 1\n\n- api_key: "str" # API key for the Open Meteo API, default is None\n- custom_query: "str" # Allows to use a custom query string, see: https://open-meteo.com/en/docs',
    FALSE
);

INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'lat',
    'float'
);
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'lon',
    'float'
);
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'timezone',
    'str'
);  
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'mode',
    'str'
);
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'future',
    'int'
);
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'api_key',
    'str'
);
INSERT INTO script_input_info (script_name, keyword, datatype)
VALUES (
    'Weather Watcher',
    'custom_query',
    'str'
);
