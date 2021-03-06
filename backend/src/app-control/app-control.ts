import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import favicon from 'serve-favicon';
import { errorMiddleware } from '../common/middlewares/error.middleware';
import path from 'path';
import cryptoRandomString from 'crypto-random-string';
import { DynamoDBAdapter } from '../common/business/db/oidc-provider-dynamodb-adapter';
import { jsbn, pki } from 'node-forge';
import base64url from 'base64url';
import { makePrivateRsaJwk } from '../common/business/crypto/make-keys';

const pugView = `
doctype html
html(lang="en")
  head
    title= pageTitle
    script(type='text/javascript').
      if (foo) bar(1 + 5);
  body
    h1 Pug #{domainPrefix}
    #container.col
      p.
        Pug is a terse and simple templating language with a
        strong focus on performance and powerful features.
`;

export class AppControl {
  public readonly app: express.Application;
  public readonly env: string;

  constructor() {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';

    // we want the favicon middleware to serve this first, so it avoids any logging - as it is irrelevant to us
    // TODO: reenable for ESM this.app.use(favicon(path.join(__dirname, 'favicon.ico')));
    this.app.use(helmet.hidePoweredBy());

    morgan.token('res-headers', (req, res) => {
      return JSON.stringify(res.getHeaders());
    });

    // set our logging format
    this.app.use(morgan('EXPRESS :method :url :response-time :res-headers'));

    this.app.get('/', (req, res) => {
      return res.send('Top');
    });

    this.app.post('/create', async (req, res) => {
      const id = cryptoRandomString({ length: 16, characters: 'bcdfghjkmnpqrstvwyz' });

      const jwksKey = await makePrivateRsaJwk();

      /*
      TODO: from the parameters passed into this API - we construct a fixture
      await new DynamoDBAdapter('Fixture').createFixture(
        id,
        {
          clients: [
            {
              client_id: 'abcd',
              client_secret: 'xyzz',
              redirect_uris: ['http://localhost:8888/callback'],
            },
          ],
          jwks: { keys: [jwksKey] },
          cookies: {
            keys: [cryptoRandomString({ length: 16, type: 'url-safe' })],
          },
        },
        3600,
      ); */

      // TODO: return enough data from the API call for clients to simulate a flow (app client id etc?)
      return res.send(`<p>${id}</p>`);
    });

    this.initializeErrorHandling();
  }

  public listen(port: number, callback?: () => void) {
    this.app.listen(port, () => {
      console.log(`???? App listening on the port ${port}`);
      if (callback) callback();
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}
