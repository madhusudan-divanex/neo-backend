import admin from "firebase-admin";

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = process.env;




const serviceAccount = {
  projectId: "neohelth-a97f7",
  clientEmail: "firebase-adminsdk-fbsvc@neohelth-a97f7.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC1GiHvjWwRyOVm\nB+hNE/rh1DpT9371AEN/93vbO37LOCkqWzEkOUnyWzEy2b82BSFrKAsI80PE6jUv\nl5EttNOuq6CwIaQGAhXisCDpcoB0RZUfGeAZLhSCvNcucjVuaIRSegp5t1ouqOsy\nqpr3X2/Pr9zgeGKb2AT5E9Uovi//jbA87QRWuK3DOlOQ11sxQwlahoY2fVFXYLlY\nuzGCld/NJAAc9QmTRx2Oeb1vlG5jbMJYgqjQ3gPilPTMjacVs4kISgUk56ZwopSX\nFdi+kD4pNSd2KH/6dH+mH4pbw+YPPeXGutCJCepG8Kkkd/KLytEHNV2hy9ZRdMNW\nCX/Crh0JAgMBAAECggEABTKn0LFVbbk/ZEtLzpKJO9wUhH5xBWUpis22n1c4z2pg\nPBf79Bc02SDm65e2Vj2VdPbkQjCBPHCgcCpAf3hWLwg8B3IfvBBpQmVdvHWN3Eh2\n/DqI5RAehJYY8vtSL0YOrjNUg6PQkdBFV+HvqrPxiJt6knLCGcj8c42vK4kx5XrG\nOrJcmMK59ox2xTl7GdgfRm448zzJCnMZcQSsIYFYVghjL8YYyD9tVU/g8TWDMPcI\n45c8E20/lcYPOUMbqEPDdgBJ7U09lJB+1fwWvJCpOUMLYXxrKBG9DNHAmClzDk5j\nqmUVV6Gq719sXRABurIWu/zvaGIIfNXUsqXTQa38pQKBgQDfquuuU4wEL+Smt3i0\nZaD0DXccBkUtz0jYwMgxnCeOj/Tupb6E9qmScUMnadlMcV+SqUxPgLyi+JGtlmLB\nLkO1snuvFZNhCHDTTNMTJIT0CHBjwMFFcSKukVGNKWLNj0SqTjFCvWBNpZTe6BJu\nGXIV29Op5IHrlIjEG/hbjM0mSwKBgQDPSAYPOZHSGGFWD6N5BbdvL7tBKQrHxQvH\niRlb4MlAlWmyT7S9udkTP1hNvhTnFhYwR6ABk3RlidcL9xvwMl6UFOvhEkzwGafV\nXgFYxUTjP6BWwhZvaXyr2cPci4RzlSTsbWlVoD74Ws+lJrTkByBT/zHgvpb3RuG3\nkwD1dc/FewKBgFUFU7FgcMjmq7Pz6h4ow5YByFUOzR0svjQmk/LHuQGoFyLgPhus\n56iTBUPmKIO2VO4bDLbr6MjKVBX4JHHqdDKNNhbHzM4Ft12axmFwcFmTG6XPj6gl\n6VkSRD20jao125QhRPhppEHfv0c8UEUpxwQoG71o7zntrE9fkni6fQEhAoGAEgwJ\nSwYOJiatQtr1trHCuNGFEjVKlP4Y+nR7Wr6FhzP7EeVSrTojJkPbolksZLpNkEKM\nMdbuyXBo4sfPDOi1x1rS9rOrMzRoonEe2OXEC60cfrFDVsvuaN/655bWH2Ia5uLX\nyva6xNDTR2PJWBkuvWF4rEKrzjfDq0IHUVfCkUUCgYBwJNz0uYRItF8Es54p6ilo\ndVHThjiH2t4+IID4lt25reZPz9vnKjqzgRhFnUOJPuUZLPD/hJoxNnBnr7NPRPNH\nULNoFuhf4Keq4OdYEXtVC0i3AhXrEdegkYWK7Rhw4Q+27KLdusRmNRj/DjEup+KY\n8D4sv/kSMvz47XFS/QCrsQ==\n-----END PRIVATE KEY-----\n"
    .replace(/\\n/g, "\n")
    .replace(/"/g, "")
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
