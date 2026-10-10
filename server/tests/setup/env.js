// Force the test configuration (test database, fast bcrypt, quiet logs) before any app module loads.
process.env.NODE_ENV = 'test';
