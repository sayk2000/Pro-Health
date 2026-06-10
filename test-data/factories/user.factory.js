const { faker } = require('@faker-js/faker');

/**
 * Generates a fresh user object. Override any field by passing it in.
 * Example: createUser({ role: 'admin' })
 */
function createUser(overrides = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    username: faker.internet.username({ firstName, lastName }).toLowerCase(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password({ length: 12, memorable: false }),
    phone: faker.phone.number(),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      country: faker.location.country(),
    },
    role: faker.helpers.arrayElement(['admin', 'viewer', 'editor']),
    ...overrides,
  };
}

function createPatient(overrides = {}) {
  return {
    ...createUser(),
    patientId: faker.string.alphanumeric(8).toUpperCase(),
    bloodGroup: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
    insuranceProvider: faker.company.name(),
    primaryDoctor: `Dr. ${faker.person.lastName()}`,
    ...overrides,
  };
}

module.exports = {
  createUser,
  createPatient,
};
