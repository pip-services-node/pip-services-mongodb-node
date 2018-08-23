import { IReferenceable } from 'pip-services-commons-node';
import { IReferences } from 'pip-services-commons-node';
import { IConfigurable } from 'pip-services-commons-node';
import { ConfigParams } from 'pip-services-commons-node';
import { ConnectionResolver } from 'pip-services-components-node';
import { CredentialResolver } from 'pip-services-components-node';
/**
 * Helper class that resolves MongoDB server URIs, along with the authentication parameters to use for the connection.
 *
 *  ### Configuration parameters ###
 *
 * Parameters to pass to the [[configure]] method for component configuration:
 *
 * - __connection(s)__
 *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
 *     - "connection.protocol" - the connection's protocol;
 *     - "connection.uri" - the Mongo URI;
 *     - "connection.host" - the Mongo host;
 *     - "connection.port" - the Mongo port;
 *     - "connection.database" - the Mongo Database;
 * - __credential(s)__
 *     - "credential.username" - the username to use for authentication;
 *     - "credential.password" - the password;
 *     - "credential.store_key" - the key to use in the credential store;
 *     - "credential.access_id" - the access ID to use;
 *     - "credential.access_key" - the access key to use;
 *
 *
 * ### References ###
 *
 * A connection resolver and a credential resolver can be referenced by passing the following references
 * to the object's [[setReferences]] method:
 *
 * - discovery: <code>"\*:discovery:\*:\*:1.0"</code>;
 * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code>.
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]] (in the PipServices "Components" package)
 * @see [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/auth.credentialresolver.html CredentialResolver]] (in the PipServices "Components" package)
 */
export declare class MongoDbConnectionResolver implements IReferenceable, IConfigurable {
    /**
     * The [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/connect.connectionresolver.html ConnectionResolver]]
     * to use for resolving connection parameters.
     */
    protected _connectionResolver: ConnectionResolver;
    /**
     * The [[https://rawgit.com/pip-services-node/pip-services-components-node/master/doc/api/classes/auth.credentialresolver.html CredentialResolver]]
     * to use for resolving credential parameters.
     */
    protected _credentialResolver: CredentialResolver;
    /**
     * Sets references to this MongoDbConnectionResolver's connection and credential resolvers.
     *
     * __References:__
     * - discovery: <code>"\*:discovery:\*:\*:1.0"</code>;
     * - credential store: <code>"\*:credential-store:\*:\*:1.0"</code>.
     *
     * @param references    an IReferences object, containing references to a discovery service
     *                      (for the connection resolver) and a credential store (for the credential
     *                      resolver).
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/interfaces/refer.ireferences.html IReferences]] (in the PipServices "Commons" package)
     */
    setReferences(references: IReferences): void;
    /**
     * Configures this MongoDbConnectionResolver using the given configuration parameters.
     *
     * __Configuration parameters:__
     * - __connection(s)__
     *     - "connection.discovery_key" - the key to use for connection resolving in a discovery service;
     *     - "connection.protocol" - the connection's protocol;
     *     - "connection.uri" - the Mongo URI;
     *     - "connection.host" - the Mongo host;
     *     - "connection.port" - the Mongo port;
     *     - "connection.database" - the Mongo Database;
     * - __credential(s)__
     *     - "credential.username" - the username to use for authentication;
     *     - "credential.password" - the password;
     *     - "credential.store_key" - the key to use in the credential store;
     *     - "credential.access_id" - the access ID to use;
     *     - "credential.access_key" - the access key to use;
     *
     * @param config    the configuration parameters to configure this MongoDbConnectionResolver with.
     *
     * @see [[https://rawgit.com/pip-services-node/pip-services-commons-node/master/doc/api/classes/config.configparams.html ConfigParams]] (in the PipServices "Commons" package)
     */
    configure(config: ConfigParams): void;
    private validateConnection;
    private validateConnections;
    private composeUri;
    /**
     * Resolves the MongoDB server's uri, along with the credentials to use for the connection,
     * using the referenced connection and credential resolvers.
     *
     * @param correlationId     unique business transaction id to trace calls across components.
     * @param callback          the function to call with the resolved uri
     *                          (or with an error, if one is raised).
     */
    resolve(correlationId: string, callback: (err: any, uri: string) => void): void;
}
