type Environment = Record<string, unknown>;

export class EnvValidator {
  static validate(config: Environment) {
    return {
      ...config,
      PORT: EnvValidator.readInteger(config, 'PORT', 8080),
      AUTH_API_URL: EnvValidator.readString(
        config,
        'AUTH_API_URL',
        'http://localhost:8000',
      ),
      AUTH_TIMEOUT_MS: EnvValidator.readInteger(config, 'AUTH_TIMEOUT_MS', 5000),
      DATABASE_PATH: EnvValidator.readString(config, 'DATABASE_PATH', 'db.sqlite'),
      NODE_ENV: EnvValidator.readString(config, 'NODE_ENV', 'development'),
    };
  }

  private static readInteger(
    config: Environment,
    key: string,
    defaultValue: number,
  ) {
    const rawValue = config[key];
    if (rawValue === undefined || rawValue === '') {
      return defaultValue;
    }

    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }

    return value;
  }

  private static readString(
    config: Environment,
    key: string,
    defaultValue: string,
  ) {
    const value = config[key];
    return typeof value === 'string' && value.trim() !== ''
      ? value
      : defaultValue;
  }
}
