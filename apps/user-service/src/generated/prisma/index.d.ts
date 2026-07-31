
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model PatientProfile
 * 
 */
export type PatientProfile = $Result.DefaultSelection<Prisma.$PatientProfilePayload>
/**
 * Model TherapistProfile
 * 
 */
export type TherapistProfile = $Result.DefaultSelection<Prisma.$TherapistProfilePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more PatientProfiles
 * const patientProfiles = await prisma.patientProfile.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more PatientProfiles
   * const patientProfiles = await prisma.patientProfile.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.patientProfile`: Exposes CRUD operations for the **PatientProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PatientProfiles
    * const patientProfiles = await prisma.patientProfile.findMany()
    * ```
    */
  get patientProfile(): Prisma.PatientProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.therapistProfile`: Exposes CRUD operations for the **TherapistProfile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TherapistProfiles
    * const therapistProfiles = await prisma.therapistProfile.findMany()
    * ```
    */
  get therapistProfile(): Prisma.TherapistProfileDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    PatientProfile: 'PatientProfile',
    TherapistProfile: 'TherapistProfile'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "patientProfile" | "therapistProfile"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      PatientProfile: {
        payload: Prisma.$PatientProfilePayload<ExtArgs>
        fields: Prisma.PatientProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PatientProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PatientProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>
          }
          findFirst: {
            args: Prisma.PatientProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PatientProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>
          }
          findMany: {
            args: Prisma.PatientProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>[]
          }
          create: {
            args: Prisma.PatientProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>
          }
          createMany: {
            args: Prisma.PatientProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PatientProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>[]
          }
          delete: {
            args: Prisma.PatientProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>
          }
          update: {
            args: Prisma.PatientProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>
          }
          deleteMany: {
            args: Prisma.PatientProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PatientProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PatientProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>[]
          }
          upsert: {
            args: Prisma.PatientProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PatientProfilePayload>
          }
          aggregate: {
            args: Prisma.PatientProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePatientProfile>
          }
          groupBy: {
            args: Prisma.PatientProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<PatientProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.PatientProfileCountArgs<ExtArgs>
            result: $Utils.Optional<PatientProfileCountAggregateOutputType> | number
          }
        }
      }
      TherapistProfile: {
        payload: Prisma.$TherapistProfilePayload<ExtArgs>
        fields: Prisma.TherapistProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TherapistProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TherapistProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>
          }
          findFirst: {
            args: Prisma.TherapistProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TherapistProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>
          }
          findMany: {
            args: Prisma.TherapistProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>[]
          }
          create: {
            args: Prisma.TherapistProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>
          }
          createMany: {
            args: Prisma.TherapistProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TherapistProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>[]
          }
          delete: {
            args: Prisma.TherapistProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>
          }
          update: {
            args: Prisma.TherapistProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>
          }
          deleteMany: {
            args: Prisma.TherapistProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TherapistProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TherapistProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>[]
          }
          upsert: {
            args: Prisma.TherapistProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TherapistProfilePayload>
          }
          aggregate: {
            args: Prisma.TherapistProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTherapistProfile>
          }
          groupBy: {
            args: Prisma.TherapistProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<TherapistProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.TherapistProfileCountArgs<ExtArgs>
            result: $Utils.Optional<TherapistProfileCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    patientProfile?: PatientProfileOmit
    therapistProfile?: TherapistProfileOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model PatientProfile
   */

  export type AggregatePatientProfile = {
    _count: PatientProfileCountAggregateOutputType | null
    _min: PatientProfileMinAggregateOutputType | null
    _max: PatientProfileMaxAggregateOutputType | null
  }

  export type PatientProfileMinAggregateOutputType = {
    id: string | null
    userId: string | null
    userName: string | null
    bio: string | null
    timezone: string | null
    languagePreference: string | null
    fcmToken: string | null
    role: string | null
    email: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PatientProfileMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    userName: string | null
    bio: string | null
    timezone: string | null
    languagePreference: string | null
    fcmToken: string | null
    role: string | null
    email: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PatientProfileCountAggregateOutputType = {
    id: number
    userId: number
    userName: number
    bio: number
    timezone: number
    languagePreference: number
    fcmToken: number
    notificationPreferences: number
    role: number
    email: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PatientProfileMinAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    bio?: true
    timezone?: true
    languagePreference?: true
    fcmToken?: true
    role?: true
    email?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PatientProfileMaxAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    bio?: true
    timezone?: true
    languagePreference?: true
    fcmToken?: true
    role?: true
    email?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PatientProfileCountAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    bio?: true
    timezone?: true
    languagePreference?: true
    fcmToken?: true
    notificationPreferences?: true
    role?: true
    email?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PatientProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PatientProfile to aggregate.
     */
    where?: PatientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PatientProfiles to fetch.
     */
    orderBy?: PatientProfileOrderByWithRelationInput | PatientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PatientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PatientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PatientProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PatientProfiles
    **/
    _count?: true | PatientProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PatientProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PatientProfileMaxAggregateInputType
  }

  export type GetPatientProfileAggregateType<T extends PatientProfileAggregateArgs> = {
        [P in keyof T & keyof AggregatePatientProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePatientProfile[P]>
      : GetScalarType<T[P], AggregatePatientProfile[P]>
  }




  export type PatientProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PatientProfileWhereInput
    orderBy?: PatientProfileOrderByWithAggregationInput | PatientProfileOrderByWithAggregationInput[]
    by: PatientProfileScalarFieldEnum[] | PatientProfileScalarFieldEnum
    having?: PatientProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PatientProfileCountAggregateInputType | true
    _min?: PatientProfileMinAggregateInputType
    _max?: PatientProfileMaxAggregateInputType
  }

  export type PatientProfileGroupByOutputType = {
    id: string
    userId: string
    userName: string | null
    bio: string | null
    timezone: string
    languagePreference: string
    fcmToken: string | null
    notificationPreferences: JsonValue
    role: string | null
    email: string | null
    createdAt: Date
    updatedAt: Date
    _count: PatientProfileCountAggregateOutputType | null
    _min: PatientProfileMinAggregateOutputType | null
    _max: PatientProfileMaxAggregateOutputType | null
  }

  type GetPatientProfileGroupByPayload<T extends PatientProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PatientProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PatientProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PatientProfileGroupByOutputType[P]>
            : GetScalarType<T[P], PatientProfileGroupByOutputType[P]>
        }
      >
    >


  export type PatientProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["patientProfile"]>

  export type PatientProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["patientProfile"]>

  export type PatientProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["patientProfile"]>

  export type PatientProfileSelectScalar = {
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PatientProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "userName" | "bio" | "timezone" | "languagePreference" | "fcmToken" | "notificationPreferences" | "role" | "email" | "createdAt" | "updatedAt", ExtArgs["result"]["patientProfile"]>

  export type $PatientProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PatientProfile"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      userName: string | null
      bio: string | null
      timezone: string
      languagePreference: string
      fcmToken: string | null
      notificationPreferences: Prisma.JsonValue
      role: string | null
      email: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["patientProfile"]>
    composites: {}
  }

  type PatientProfileGetPayload<S extends boolean | null | undefined | PatientProfileDefaultArgs> = $Result.GetResult<Prisma.$PatientProfilePayload, S>

  type PatientProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PatientProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PatientProfileCountAggregateInputType | true
    }

  export interface PatientProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PatientProfile'], meta: { name: 'PatientProfile' } }
    /**
     * Find zero or one PatientProfile that matches the filter.
     * @param {PatientProfileFindUniqueArgs} args - Arguments to find a PatientProfile
     * @example
     * // Get one PatientProfile
     * const patientProfile = await prisma.patientProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PatientProfileFindUniqueArgs>(args: SelectSubset<T, PatientProfileFindUniqueArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PatientProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PatientProfileFindUniqueOrThrowArgs} args - Arguments to find a PatientProfile
     * @example
     * // Get one PatientProfile
     * const patientProfile = await prisma.patientProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PatientProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, PatientProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PatientProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileFindFirstArgs} args - Arguments to find a PatientProfile
     * @example
     * // Get one PatientProfile
     * const patientProfile = await prisma.patientProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PatientProfileFindFirstArgs>(args?: SelectSubset<T, PatientProfileFindFirstArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PatientProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileFindFirstOrThrowArgs} args - Arguments to find a PatientProfile
     * @example
     * // Get one PatientProfile
     * const patientProfile = await prisma.patientProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PatientProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, PatientProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PatientProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PatientProfiles
     * const patientProfiles = await prisma.patientProfile.findMany()
     * 
     * // Get first 10 PatientProfiles
     * const patientProfiles = await prisma.patientProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const patientProfileWithIdOnly = await prisma.patientProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PatientProfileFindManyArgs>(args?: SelectSubset<T, PatientProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PatientProfile.
     * @param {PatientProfileCreateArgs} args - Arguments to create a PatientProfile.
     * @example
     * // Create one PatientProfile
     * const PatientProfile = await prisma.patientProfile.create({
     *   data: {
     *     // ... data to create a PatientProfile
     *   }
     * })
     * 
     */
    create<T extends PatientProfileCreateArgs>(args: SelectSubset<T, PatientProfileCreateArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PatientProfiles.
     * @param {PatientProfileCreateManyArgs} args - Arguments to create many PatientProfiles.
     * @example
     * // Create many PatientProfiles
     * const patientProfile = await prisma.patientProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PatientProfileCreateManyArgs>(args?: SelectSubset<T, PatientProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PatientProfiles and returns the data saved in the database.
     * @param {PatientProfileCreateManyAndReturnArgs} args - Arguments to create many PatientProfiles.
     * @example
     * // Create many PatientProfiles
     * const patientProfile = await prisma.patientProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PatientProfiles and only return the `id`
     * const patientProfileWithIdOnly = await prisma.patientProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PatientProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, PatientProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PatientProfile.
     * @param {PatientProfileDeleteArgs} args - Arguments to delete one PatientProfile.
     * @example
     * // Delete one PatientProfile
     * const PatientProfile = await prisma.patientProfile.delete({
     *   where: {
     *     // ... filter to delete one PatientProfile
     *   }
     * })
     * 
     */
    delete<T extends PatientProfileDeleteArgs>(args: SelectSubset<T, PatientProfileDeleteArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PatientProfile.
     * @param {PatientProfileUpdateArgs} args - Arguments to update one PatientProfile.
     * @example
     * // Update one PatientProfile
     * const patientProfile = await prisma.patientProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PatientProfileUpdateArgs>(args: SelectSubset<T, PatientProfileUpdateArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PatientProfiles.
     * @param {PatientProfileDeleteManyArgs} args - Arguments to filter PatientProfiles to delete.
     * @example
     * // Delete a few PatientProfiles
     * const { count } = await prisma.patientProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PatientProfileDeleteManyArgs>(args?: SelectSubset<T, PatientProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PatientProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PatientProfiles
     * const patientProfile = await prisma.patientProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PatientProfileUpdateManyArgs>(args: SelectSubset<T, PatientProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PatientProfiles and returns the data updated in the database.
     * @param {PatientProfileUpdateManyAndReturnArgs} args - Arguments to update many PatientProfiles.
     * @example
     * // Update many PatientProfiles
     * const patientProfile = await prisma.patientProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PatientProfiles and only return the `id`
     * const patientProfileWithIdOnly = await prisma.patientProfile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PatientProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, PatientProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PatientProfile.
     * @param {PatientProfileUpsertArgs} args - Arguments to update or create a PatientProfile.
     * @example
     * // Update or create a PatientProfile
     * const patientProfile = await prisma.patientProfile.upsert({
     *   create: {
     *     // ... data to create a PatientProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PatientProfile we want to update
     *   }
     * })
     */
    upsert<T extends PatientProfileUpsertArgs>(args: SelectSubset<T, PatientProfileUpsertArgs<ExtArgs>>): Prisma__PatientProfileClient<$Result.GetResult<Prisma.$PatientProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PatientProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileCountArgs} args - Arguments to filter PatientProfiles to count.
     * @example
     * // Count the number of PatientProfiles
     * const count = await prisma.patientProfile.count({
     *   where: {
     *     // ... the filter for the PatientProfiles we want to count
     *   }
     * })
    **/
    count<T extends PatientProfileCountArgs>(
      args?: Subset<T, PatientProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PatientProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PatientProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PatientProfileAggregateArgs>(args: Subset<T, PatientProfileAggregateArgs>): Prisma.PrismaPromise<GetPatientProfileAggregateType<T>>

    /**
     * Group by PatientProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PatientProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PatientProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PatientProfileGroupByArgs['orderBy'] }
        : { orderBy?: PatientProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PatientProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPatientProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PatientProfile model
   */
  readonly fields: PatientProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PatientProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PatientProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PatientProfile model
   */
  interface PatientProfileFieldRefs {
    readonly id: FieldRef<"PatientProfile", 'String'>
    readonly userId: FieldRef<"PatientProfile", 'String'>
    readonly userName: FieldRef<"PatientProfile", 'String'>
    readonly bio: FieldRef<"PatientProfile", 'String'>
    readonly timezone: FieldRef<"PatientProfile", 'String'>
    readonly languagePreference: FieldRef<"PatientProfile", 'String'>
    readonly fcmToken: FieldRef<"PatientProfile", 'String'>
    readonly notificationPreferences: FieldRef<"PatientProfile", 'Json'>
    readonly role: FieldRef<"PatientProfile", 'String'>
    readonly email: FieldRef<"PatientProfile", 'String'>
    readonly createdAt: FieldRef<"PatientProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"PatientProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PatientProfile findUnique
   */
  export type PatientProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * Filter, which PatientProfile to fetch.
     */
    where: PatientProfileWhereUniqueInput
  }

  /**
   * PatientProfile findUniqueOrThrow
   */
  export type PatientProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * Filter, which PatientProfile to fetch.
     */
    where: PatientProfileWhereUniqueInput
  }

  /**
   * PatientProfile findFirst
   */
  export type PatientProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * Filter, which PatientProfile to fetch.
     */
    where?: PatientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PatientProfiles to fetch.
     */
    orderBy?: PatientProfileOrderByWithRelationInput | PatientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PatientProfiles.
     */
    cursor?: PatientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PatientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PatientProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PatientProfiles.
     */
    distinct?: PatientProfileScalarFieldEnum | PatientProfileScalarFieldEnum[]
  }

  /**
   * PatientProfile findFirstOrThrow
   */
  export type PatientProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * Filter, which PatientProfile to fetch.
     */
    where?: PatientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PatientProfiles to fetch.
     */
    orderBy?: PatientProfileOrderByWithRelationInput | PatientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PatientProfiles.
     */
    cursor?: PatientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PatientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PatientProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PatientProfiles.
     */
    distinct?: PatientProfileScalarFieldEnum | PatientProfileScalarFieldEnum[]
  }

  /**
   * PatientProfile findMany
   */
  export type PatientProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * Filter, which PatientProfiles to fetch.
     */
    where?: PatientProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PatientProfiles to fetch.
     */
    orderBy?: PatientProfileOrderByWithRelationInput | PatientProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PatientProfiles.
     */
    cursor?: PatientProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PatientProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PatientProfiles.
     */
    skip?: number
    distinct?: PatientProfileScalarFieldEnum | PatientProfileScalarFieldEnum[]
  }

  /**
   * PatientProfile create
   */
  export type PatientProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * The data needed to create a PatientProfile.
     */
    data: XOR<PatientProfileCreateInput, PatientProfileUncheckedCreateInput>
  }

  /**
   * PatientProfile createMany
   */
  export type PatientProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PatientProfiles.
     */
    data: PatientProfileCreateManyInput | PatientProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PatientProfile createManyAndReturn
   */
  export type PatientProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * The data used to create many PatientProfiles.
     */
    data: PatientProfileCreateManyInput | PatientProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PatientProfile update
   */
  export type PatientProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * The data needed to update a PatientProfile.
     */
    data: XOR<PatientProfileUpdateInput, PatientProfileUncheckedUpdateInput>
    /**
     * Choose, which PatientProfile to update.
     */
    where: PatientProfileWhereUniqueInput
  }

  /**
   * PatientProfile updateMany
   */
  export type PatientProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PatientProfiles.
     */
    data: XOR<PatientProfileUpdateManyMutationInput, PatientProfileUncheckedUpdateManyInput>
    /**
     * Filter which PatientProfiles to update
     */
    where?: PatientProfileWhereInput
    /**
     * Limit how many PatientProfiles to update.
     */
    limit?: number
  }

  /**
   * PatientProfile updateManyAndReturn
   */
  export type PatientProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * The data used to update PatientProfiles.
     */
    data: XOR<PatientProfileUpdateManyMutationInput, PatientProfileUncheckedUpdateManyInput>
    /**
     * Filter which PatientProfiles to update
     */
    where?: PatientProfileWhereInput
    /**
     * Limit how many PatientProfiles to update.
     */
    limit?: number
  }

  /**
   * PatientProfile upsert
   */
  export type PatientProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * The filter to search for the PatientProfile to update in case it exists.
     */
    where: PatientProfileWhereUniqueInput
    /**
     * In case the PatientProfile found by the `where` argument doesn't exist, create a new PatientProfile with this data.
     */
    create: XOR<PatientProfileCreateInput, PatientProfileUncheckedCreateInput>
    /**
     * In case the PatientProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PatientProfileUpdateInput, PatientProfileUncheckedUpdateInput>
  }

  /**
   * PatientProfile delete
   */
  export type PatientProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
    /**
     * Filter which PatientProfile to delete.
     */
    where: PatientProfileWhereUniqueInput
  }

  /**
   * PatientProfile deleteMany
   */
  export type PatientProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PatientProfiles to delete
     */
    where?: PatientProfileWhereInput
    /**
     * Limit how many PatientProfiles to delete.
     */
    limit?: number
  }

  /**
   * PatientProfile without action
   */
  export type PatientProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PatientProfile
     */
    select?: PatientProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PatientProfile
     */
    omit?: PatientProfileOmit<ExtArgs> | null
  }


  /**
   * Model TherapistProfile
   */

  export type AggregateTherapistProfile = {
    _count: TherapistProfileCountAggregateOutputType | null
    _min: TherapistProfileMinAggregateOutputType | null
    _max: TherapistProfileMaxAggregateOutputType | null
  }

  export type TherapistProfileMinAggregateOutputType = {
    id: string | null
    userId: string | null
    userName: string | null
    bio: string | null
    timezone: string | null
    languagePreference: string | null
    specialisation: string | null
    isAcceptingPatients: boolean | null
    photoUrl: string | null
    fcmToken: string | null
    role: string | null
    email: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TherapistProfileMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    userName: string | null
    bio: string | null
    timezone: string | null
    languagePreference: string | null
    specialisation: string | null
    isAcceptingPatients: boolean | null
    photoUrl: string | null
    fcmToken: string | null
    role: string | null
    email: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TherapistProfileCountAggregateOutputType = {
    id: number
    userId: number
    userName: number
    bio: number
    timezone: number
    languagePreference: number
    specialisation: number
    languages: number
    isAcceptingPatients: number
    photoUrl: number
    fcmToken: number
    notificationPreferences: number
    role: number
    email: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TherapistProfileMinAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    bio?: true
    timezone?: true
    languagePreference?: true
    specialisation?: true
    isAcceptingPatients?: true
    photoUrl?: true
    fcmToken?: true
    role?: true
    email?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TherapistProfileMaxAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    bio?: true
    timezone?: true
    languagePreference?: true
    specialisation?: true
    isAcceptingPatients?: true
    photoUrl?: true
    fcmToken?: true
    role?: true
    email?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TherapistProfileCountAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    bio?: true
    timezone?: true
    languagePreference?: true
    specialisation?: true
    languages?: true
    isAcceptingPatients?: true
    photoUrl?: true
    fcmToken?: true
    notificationPreferences?: true
    role?: true
    email?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TherapistProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TherapistProfile to aggregate.
     */
    where?: TherapistProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TherapistProfiles to fetch.
     */
    orderBy?: TherapistProfileOrderByWithRelationInput | TherapistProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TherapistProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TherapistProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TherapistProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TherapistProfiles
    **/
    _count?: true | TherapistProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TherapistProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TherapistProfileMaxAggregateInputType
  }

  export type GetTherapistProfileAggregateType<T extends TherapistProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateTherapistProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTherapistProfile[P]>
      : GetScalarType<T[P], AggregateTherapistProfile[P]>
  }




  export type TherapistProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TherapistProfileWhereInput
    orderBy?: TherapistProfileOrderByWithAggregationInput | TherapistProfileOrderByWithAggregationInput[]
    by: TherapistProfileScalarFieldEnum[] | TherapistProfileScalarFieldEnum
    having?: TherapistProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TherapistProfileCountAggregateInputType | true
    _min?: TherapistProfileMinAggregateInputType
    _max?: TherapistProfileMaxAggregateInputType
  }

  export type TherapistProfileGroupByOutputType = {
    id: string
    userId: string
    userName: string | null
    bio: string | null
    timezone: string
    languagePreference: string
    specialisation: string | null
    languages: string[]
    isAcceptingPatients: boolean
    photoUrl: string | null
    fcmToken: string | null
    notificationPreferences: JsonValue
    role: string | null
    email: string | null
    createdAt: Date
    updatedAt: Date
    _count: TherapistProfileCountAggregateOutputType | null
    _min: TherapistProfileMinAggregateOutputType | null
    _max: TherapistProfileMaxAggregateOutputType | null
  }

  type GetTherapistProfileGroupByPayload<T extends TherapistProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TherapistProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TherapistProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TherapistProfileGroupByOutputType[P]>
            : GetScalarType<T[P], TherapistProfileGroupByOutputType[P]>
        }
      >
    >


  export type TherapistProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    specialisation?: boolean
    languages?: boolean
    isAcceptingPatients?: boolean
    photoUrl?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["therapistProfile"]>

  export type TherapistProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    specialisation?: boolean
    languages?: boolean
    isAcceptingPatients?: boolean
    photoUrl?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["therapistProfile"]>

  export type TherapistProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    specialisation?: boolean
    languages?: boolean
    isAcceptingPatients?: boolean
    photoUrl?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["therapistProfile"]>

  export type TherapistProfileSelectScalar = {
    id?: boolean
    userId?: boolean
    userName?: boolean
    bio?: boolean
    timezone?: boolean
    languagePreference?: boolean
    specialisation?: boolean
    languages?: boolean
    isAcceptingPatients?: boolean
    photoUrl?: boolean
    fcmToken?: boolean
    notificationPreferences?: boolean
    role?: boolean
    email?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TherapistProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "userName" | "bio" | "timezone" | "languagePreference" | "specialisation" | "languages" | "isAcceptingPatients" | "photoUrl" | "fcmToken" | "notificationPreferences" | "role" | "email" | "createdAt" | "updatedAt", ExtArgs["result"]["therapistProfile"]>

  export type $TherapistProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TherapistProfile"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      userName: string | null
      bio: string | null
      timezone: string
      languagePreference: string
      specialisation: string | null
      languages: string[]
      isAcceptingPatients: boolean
      photoUrl: string | null
      fcmToken: string | null
      notificationPreferences: Prisma.JsonValue
      role: string | null
      email: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["therapistProfile"]>
    composites: {}
  }

  type TherapistProfileGetPayload<S extends boolean | null | undefined | TherapistProfileDefaultArgs> = $Result.GetResult<Prisma.$TherapistProfilePayload, S>

  type TherapistProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TherapistProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TherapistProfileCountAggregateInputType | true
    }

  export interface TherapistProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TherapistProfile'], meta: { name: 'TherapistProfile' } }
    /**
     * Find zero or one TherapistProfile that matches the filter.
     * @param {TherapistProfileFindUniqueArgs} args - Arguments to find a TherapistProfile
     * @example
     * // Get one TherapistProfile
     * const therapistProfile = await prisma.therapistProfile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TherapistProfileFindUniqueArgs>(args: SelectSubset<T, TherapistProfileFindUniqueArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TherapistProfile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TherapistProfileFindUniqueOrThrowArgs} args - Arguments to find a TherapistProfile
     * @example
     * // Get one TherapistProfile
     * const therapistProfile = await prisma.therapistProfile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TherapistProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, TherapistProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TherapistProfile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileFindFirstArgs} args - Arguments to find a TherapistProfile
     * @example
     * // Get one TherapistProfile
     * const therapistProfile = await prisma.therapistProfile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TherapistProfileFindFirstArgs>(args?: SelectSubset<T, TherapistProfileFindFirstArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TherapistProfile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileFindFirstOrThrowArgs} args - Arguments to find a TherapistProfile
     * @example
     * // Get one TherapistProfile
     * const therapistProfile = await prisma.therapistProfile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TherapistProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, TherapistProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TherapistProfiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TherapistProfiles
     * const therapistProfiles = await prisma.therapistProfile.findMany()
     * 
     * // Get first 10 TherapistProfiles
     * const therapistProfiles = await prisma.therapistProfile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const therapistProfileWithIdOnly = await prisma.therapistProfile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TherapistProfileFindManyArgs>(args?: SelectSubset<T, TherapistProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TherapistProfile.
     * @param {TherapistProfileCreateArgs} args - Arguments to create a TherapistProfile.
     * @example
     * // Create one TherapistProfile
     * const TherapistProfile = await prisma.therapistProfile.create({
     *   data: {
     *     // ... data to create a TherapistProfile
     *   }
     * })
     * 
     */
    create<T extends TherapistProfileCreateArgs>(args: SelectSubset<T, TherapistProfileCreateArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TherapistProfiles.
     * @param {TherapistProfileCreateManyArgs} args - Arguments to create many TherapistProfiles.
     * @example
     * // Create many TherapistProfiles
     * const therapistProfile = await prisma.therapistProfile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TherapistProfileCreateManyArgs>(args?: SelectSubset<T, TherapistProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TherapistProfiles and returns the data saved in the database.
     * @param {TherapistProfileCreateManyAndReturnArgs} args - Arguments to create many TherapistProfiles.
     * @example
     * // Create many TherapistProfiles
     * const therapistProfile = await prisma.therapistProfile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TherapistProfiles and only return the `id`
     * const therapistProfileWithIdOnly = await prisma.therapistProfile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TherapistProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, TherapistProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TherapistProfile.
     * @param {TherapistProfileDeleteArgs} args - Arguments to delete one TherapistProfile.
     * @example
     * // Delete one TherapistProfile
     * const TherapistProfile = await prisma.therapistProfile.delete({
     *   where: {
     *     // ... filter to delete one TherapistProfile
     *   }
     * })
     * 
     */
    delete<T extends TherapistProfileDeleteArgs>(args: SelectSubset<T, TherapistProfileDeleteArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TherapistProfile.
     * @param {TherapistProfileUpdateArgs} args - Arguments to update one TherapistProfile.
     * @example
     * // Update one TherapistProfile
     * const therapistProfile = await prisma.therapistProfile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TherapistProfileUpdateArgs>(args: SelectSubset<T, TherapistProfileUpdateArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TherapistProfiles.
     * @param {TherapistProfileDeleteManyArgs} args - Arguments to filter TherapistProfiles to delete.
     * @example
     * // Delete a few TherapistProfiles
     * const { count } = await prisma.therapistProfile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TherapistProfileDeleteManyArgs>(args?: SelectSubset<T, TherapistProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TherapistProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TherapistProfiles
     * const therapistProfile = await prisma.therapistProfile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TherapistProfileUpdateManyArgs>(args: SelectSubset<T, TherapistProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TherapistProfiles and returns the data updated in the database.
     * @param {TherapistProfileUpdateManyAndReturnArgs} args - Arguments to update many TherapistProfiles.
     * @example
     * // Update many TherapistProfiles
     * const therapistProfile = await prisma.therapistProfile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TherapistProfiles and only return the `id`
     * const therapistProfileWithIdOnly = await prisma.therapistProfile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TherapistProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, TherapistProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TherapistProfile.
     * @param {TherapistProfileUpsertArgs} args - Arguments to update or create a TherapistProfile.
     * @example
     * // Update or create a TherapistProfile
     * const therapistProfile = await prisma.therapistProfile.upsert({
     *   create: {
     *     // ... data to create a TherapistProfile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TherapistProfile we want to update
     *   }
     * })
     */
    upsert<T extends TherapistProfileUpsertArgs>(args: SelectSubset<T, TherapistProfileUpsertArgs<ExtArgs>>): Prisma__TherapistProfileClient<$Result.GetResult<Prisma.$TherapistProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TherapistProfiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileCountArgs} args - Arguments to filter TherapistProfiles to count.
     * @example
     * // Count the number of TherapistProfiles
     * const count = await prisma.therapistProfile.count({
     *   where: {
     *     // ... the filter for the TherapistProfiles we want to count
     *   }
     * })
    **/
    count<T extends TherapistProfileCountArgs>(
      args?: Subset<T, TherapistProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TherapistProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TherapistProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TherapistProfileAggregateArgs>(args: Subset<T, TherapistProfileAggregateArgs>): Prisma.PrismaPromise<GetTherapistProfileAggregateType<T>>

    /**
     * Group by TherapistProfile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TherapistProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TherapistProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TherapistProfileGroupByArgs['orderBy'] }
        : { orderBy?: TherapistProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TherapistProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTherapistProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TherapistProfile model
   */
  readonly fields: TherapistProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TherapistProfile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TherapistProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TherapistProfile model
   */
  interface TherapistProfileFieldRefs {
    readonly id: FieldRef<"TherapistProfile", 'String'>
    readonly userId: FieldRef<"TherapistProfile", 'String'>
    readonly userName: FieldRef<"TherapistProfile", 'String'>
    readonly bio: FieldRef<"TherapistProfile", 'String'>
    readonly timezone: FieldRef<"TherapistProfile", 'String'>
    readonly languagePreference: FieldRef<"TherapistProfile", 'String'>
    readonly specialisation: FieldRef<"TherapistProfile", 'String'>
    readonly languages: FieldRef<"TherapistProfile", 'String[]'>
    readonly isAcceptingPatients: FieldRef<"TherapistProfile", 'Boolean'>
    readonly photoUrl: FieldRef<"TherapistProfile", 'String'>
    readonly fcmToken: FieldRef<"TherapistProfile", 'String'>
    readonly notificationPreferences: FieldRef<"TherapistProfile", 'Json'>
    readonly role: FieldRef<"TherapistProfile", 'String'>
    readonly email: FieldRef<"TherapistProfile", 'String'>
    readonly createdAt: FieldRef<"TherapistProfile", 'DateTime'>
    readonly updatedAt: FieldRef<"TherapistProfile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TherapistProfile findUnique
   */
  export type TherapistProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * Filter, which TherapistProfile to fetch.
     */
    where: TherapistProfileWhereUniqueInput
  }

  /**
   * TherapistProfile findUniqueOrThrow
   */
  export type TherapistProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * Filter, which TherapistProfile to fetch.
     */
    where: TherapistProfileWhereUniqueInput
  }

  /**
   * TherapistProfile findFirst
   */
  export type TherapistProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * Filter, which TherapistProfile to fetch.
     */
    where?: TherapistProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TherapistProfiles to fetch.
     */
    orderBy?: TherapistProfileOrderByWithRelationInput | TherapistProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TherapistProfiles.
     */
    cursor?: TherapistProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TherapistProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TherapistProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TherapistProfiles.
     */
    distinct?: TherapistProfileScalarFieldEnum | TherapistProfileScalarFieldEnum[]
  }

  /**
   * TherapistProfile findFirstOrThrow
   */
  export type TherapistProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * Filter, which TherapistProfile to fetch.
     */
    where?: TherapistProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TherapistProfiles to fetch.
     */
    orderBy?: TherapistProfileOrderByWithRelationInput | TherapistProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TherapistProfiles.
     */
    cursor?: TherapistProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TherapistProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TherapistProfiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TherapistProfiles.
     */
    distinct?: TherapistProfileScalarFieldEnum | TherapistProfileScalarFieldEnum[]
  }

  /**
   * TherapistProfile findMany
   */
  export type TherapistProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * Filter, which TherapistProfiles to fetch.
     */
    where?: TherapistProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TherapistProfiles to fetch.
     */
    orderBy?: TherapistProfileOrderByWithRelationInput | TherapistProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TherapistProfiles.
     */
    cursor?: TherapistProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TherapistProfiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TherapistProfiles.
     */
    skip?: number
    distinct?: TherapistProfileScalarFieldEnum | TherapistProfileScalarFieldEnum[]
  }

  /**
   * TherapistProfile create
   */
  export type TherapistProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * The data needed to create a TherapistProfile.
     */
    data: XOR<TherapistProfileCreateInput, TherapistProfileUncheckedCreateInput>
  }

  /**
   * TherapistProfile createMany
   */
  export type TherapistProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TherapistProfiles.
     */
    data: TherapistProfileCreateManyInput | TherapistProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TherapistProfile createManyAndReturn
   */
  export type TherapistProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * The data used to create many TherapistProfiles.
     */
    data: TherapistProfileCreateManyInput | TherapistProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TherapistProfile update
   */
  export type TherapistProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * The data needed to update a TherapistProfile.
     */
    data: XOR<TherapistProfileUpdateInput, TherapistProfileUncheckedUpdateInput>
    /**
     * Choose, which TherapistProfile to update.
     */
    where: TherapistProfileWhereUniqueInput
  }

  /**
   * TherapistProfile updateMany
   */
  export type TherapistProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TherapistProfiles.
     */
    data: XOR<TherapistProfileUpdateManyMutationInput, TherapistProfileUncheckedUpdateManyInput>
    /**
     * Filter which TherapistProfiles to update
     */
    where?: TherapistProfileWhereInput
    /**
     * Limit how many TherapistProfiles to update.
     */
    limit?: number
  }

  /**
   * TherapistProfile updateManyAndReturn
   */
  export type TherapistProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * The data used to update TherapistProfiles.
     */
    data: XOR<TherapistProfileUpdateManyMutationInput, TherapistProfileUncheckedUpdateManyInput>
    /**
     * Filter which TherapistProfiles to update
     */
    where?: TherapistProfileWhereInput
    /**
     * Limit how many TherapistProfiles to update.
     */
    limit?: number
  }

  /**
   * TherapistProfile upsert
   */
  export type TherapistProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * The filter to search for the TherapistProfile to update in case it exists.
     */
    where: TherapistProfileWhereUniqueInput
    /**
     * In case the TherapistProfile found by the `where` argument doesn't exist, create a new TherapistProfile with this data.
     */
    create: XOR<TherapistProfileCreateInput, TherapistProfileUncheckedCreateInput>
    /**
     * In case the TherapistProfile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TherapistProfileUpdateInput, TherapistProfileUncheckedUpdateInput>
  }

  /**
   * TherapistProfile delete
   */
  export type TherapistProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
    /**
     * Filter which TherapistProfile to delete.
     */
    where: TherapistProfileWhereUniqueInput
  }

  /**
   * TherapistProfile deleteMany
   */
  export type TherapistProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TherapistProfiles to delete
     */
    where?: TherapistProfileWhereInput
    /**
     * Limit how many TherapistProfiles to delete.
     */
    limit?: number
  }

  /**
   * TherapistProfile without action
   */
  export type TherapistProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TherapistProfile
     */
    select?: TherapistProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TherapistProfile
     */
    omit?: TherapistProfileOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const PatientProfileScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    userName: 'userName',
    bio: 'bio',
    timezone: 'timezone',
    languagePreference: 'languagePreference',
    fcmToken: 'fcmToken',
    notificationPreferences: 'notificationPreferences',
    role: 'role',
    email: 'email',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PatientProfileScalarFieldEnum = (typeof PatientProfileScalarFieldEnum)[keyof typeof PatientProfileScalarFieldEnum]


  export const TherapistProfileScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    userName: 'userName',
    bio: 'bio',
    timezone: 'timezone',
    languagePreference: 'languagePreference',
    specialisation: 'specialisation',
    languages: 'languages',
    isAcceptingPatients: 'isAcceptingPatients',
    photoUrl: 'photoUrl',
    fcmToken: 'fcmToken',
    notificationPreferences: 'notificationPreferences',
    role: 'role',
    email: 'email',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TherapistProfileScalarFieldEnum = (typeof TherapistProfileScalarFieldEnum)[keyof typeof TherapistProfileScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type PatientProfileWhereInput = {
    AND?: PatientProfileWhereInput | PatientProfileWhereInput[]
    OR?: PatientProfileWhereInput[]
    NOT?: PatientProfileWhereInput | PatientProfileWhereInput[]
    id?: UuidFilter<"PatientProfile"> | string
    userId?: UuidFilter<"PatientProfile"> | string
    userName?: StringNullableFilter<"PatientProfile"> | string | null
    bio?: StringNullableFilter<"PatientProfile"> | string | null
    timezone?: StringFilter<"PatientProfile"> | string
    languagePreference?: StringFilter<"PatientProfile"> | string
    fcmToken?: StringNullableFilter<"PatientProfile"> | string | null
    notificationPreferences?: JsonFilter<"PatientProfile">
    role?: StringNullableFilter<"PatientProfile"> | string | null
    email?: StringNullableFilter<"PatientProfile"> | string | null
    createdAt?: DateTimeFilter<"PatientProfile"> | Date | string
    updatedAt?: DateTimeFilter<"PatientProfile"> | Date | string
  }

  export type PatientProfileOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    fcmToken?: SortOrderInput | SortOrder
    notificationPreferences?: SortOrder
    role?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PatientProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: PatientProfileWhereInput | PatientProfileWhereInput[]
    OR?: PatientProfileWhereInput[]
    NOT?: PatientProfileWhereInput | PatientProfileWhereInput[]
    userName?: StringNullableFilter<"PatientProfile"> | string | null
    bio?: StringNullableFilter<"PatientProfile"> | string | null
    timezone?: StringFilter<"PatientProfile"> | string
    languagePreference?: StringFilter<"PatientProfile"> | string
    fcmToken?: StringNullableFilter<"PatientProfile"> | string | null
    notificationPreferences?: JsonFilter<"PatientProfile">
    role?: StringNullableFilter<"PatientProfile"> | string | null
    email?: StringNullableFilter<"PatientProfile"> | string | null
    createdAt?: DateTimeFilter<"PatientProfile"> | Date | string
    updatedAt?: DateTimeFilter<"PatientProfile"> | Date | string
  }, "id" | "userId">

  export type PatientProfileOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    fcmToken?: SortOrderInput | SortOrder
    notificationPreferences?: SortOrder
    role?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PatientProfileCountOrderByAggregateInput
    _max?: PatientProfileMaxOrderByAggregateInput
    _min?: PatientProfileMinOrderByAggregateInput
  }

  export type PatientProfileScalarWhereWithAggregatesInput = {
    AND?: PatientProfileScalarWhereWithAggregatesInput | PatientProfileScalarWhereWithAggregatesInput[]
    OR?: PatientProfileScalarWhereWithAggregatesInput[]
    NOT?: PatientProfileScalarWhereWithAggregatesInput | PatientProfileScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"PatientProfile"> | string
    userId?: UuidWithAggregatesFilter<"PatientProfile"> | string
    userName?: StringNullableWithAggregatesFilter<"PatientProfile"> | string | null
    bio?: StringNullableWithAggregatesFilter<"PatientProfile"> | string | null
    timezone?: StringWithAggregatesFilter<"PatientProfile"> | string
    languagePreference?: StringWithAggregatesFilter<"PatientProfile"> | string
    fcmToken?: StringNullableWithAggregatesFilter<"PatientProfile"> | string | null
    notificationPreferences?: JsonWithAggregatesFilter<"PatientProfile">
    role?: StringNullableWithAggregatesFilter<"PatientProfile"> | string | null
    email?: StringNullableWithAggregatesFilter<"PatientProfile"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PatientProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PatientProfile"> | Date | string
  }

  export type TherapistProfileWhereInput = {
    AND?: TherapistProfileWhereInput | TherapistProfileWhereInput[]
    OR?: TherapistProfileWhereInput[]
    NOT?: TherapistProfileWhereInput | TherapistProfileWhereInput[]
    id?: UuidFilter<"TherapistProfile"> | string
    userId?: UuidFilter<"TherapistProfile"> | string
    userName?: StringNullableFilter<"TherapistProfile"> | string | null
    bio?: StringNullableFilter<"TherapistProfile"> | string | null
    timezone?: StringFilter<"TherapistProfile"> | string
    languagePreference?: StringFilter<"TherapistProfile"> | string
    specialisation?: StringNullableFilter<"TherapistProfile"> | string | null
    languages?: StringNullableListFilter<"TherapistProfile">
    isAcceptingPatients?: BoolFilter<"TherapistProfile"> | boolean
    photoUrl?: StringNullableFilter<"TherapistProfile"> | string | null
    fcmToken?: StringNullableFilter<"TherapistProfile"> | string | null
    notificationPreferences?: JsonFilter<"TherapistProfile">
    role?: StringNullableFilter<"TherapistProfile"> | string | null
    email?: StringNullableFilter<"TherapistProfile"> | string | null
    createdAt?: DateTimeFilter<"TherapistProfile"> | Date | string
    updatedAt?: DateTimeFilter<"TherapistProfile"> | Date | string
  }

  export type TherapistProfileOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    specialisation?: SortOrderInput | SortOrder
    languages?: SortOrder
    isAcceptingPatients?: SortOrder
    photoUrl?: SortOrderInput | SortOrder
    fcmToken?: SortOrderInput | SortOrder
    notificationPreferences?: SortOrder
    role?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TherapistProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: TherapistProfileWhereInput | TherapistProfileWhereInput[]
    OR?: TherapistProfileWhereInput[]
    NOT?: TherapistProfileWhereInput | TherapistProfileWhereInput[]
    userName?: StringNullableFilter<"TherapistProfile"> | string | null
    bio?: StringNullableFilter<"TherapistProfile"> | string | null
    timezone?: StringFilter<"TherapistProfile"> | string
    languagePreference?: StringFilter<"TherapistProfile"> | string
    specialisation?: StringNullableFilter<"TherapistProfile"> | string | null
    languages?: StringNullableListFilter<"TherapistProfile">
    isAcceptingPatients?: BoolFilter<"TherapistProfile"> | boolean
    photoUrl?: StringNullableFilter<"TherapistProfile"> | string | null
    fcmToken?: StringNullableFilter<"TherapistProfile"> | string | null
    notificationPreferences?: JsonFilter<"TherapistProfile">
    role?: StringNullableFilter<"TherapistProfile"> | string | null
    email?: StringNullableFilter<"TherapistProfile"> | string | null
    createdAt?: DateTimeFilter<"TherapistProfile"> | Date | string
    updatedAt?: DateTimeFilter<"TherapistProfile"> | Date | string
  }, "id" | "userId">

  export type TherapistProfileOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    specialisation?: SortOrderInput | SortOrder
    languages?: SortOrder
    isAcceptingPatients?: SortOrder
    photoUrl?: SortOrderInput | SortOrder
    fcmToken?: SortOrderInput | SortOrder
    notificationPreferences?: SortOrder
    role?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TherapistProfileCountOrderByAggregateInput
    _max?: TherapistProfileMaxOrderByAggregateInput
    _min?: TherapistProfileMinOrderByAggregateInput
  }

  export type TherapistProfileScalarWhereWithAggregatesInput = {
    AND?: TherapistProfileScalarWhereWithAggregatesInput | TherapistProfileScalarWhereWithAggregatesInput[]
    OR?: TherapistProfileScalarWhereWithAggregatesInput[]
    NOT?: TherapistProfileScalarWhereWithAggregatesInput | TherapistProfileScalarWhereWithAggregatesInput[]
    id?: UuidWithAggregatesFilter<"TherapistProfile"> | string
    userId?: UuidWithAggregatesFilter<"TherapistProfile"> | string
    userName?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    bio?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    timezone?: StringWithAggregatesFilter<"TherapistProfile"> | string
    languagePreference?: StringWithAggregatesFilter<"TherapistProfile"> | string
    specialisation?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    languages?: StringNullableListFilter<"TherapistProfile">
    isAcceptingPatients?: BoolWithAggregatesFilter<"TherapistProfile"> | boolean
    photoUrl?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    fcmToken?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    notificationPreferences?: JsonWithAggregatesFilter<"TherapistProfile">
    role?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    email?: StringNullableWithAggregatesFilter<"TherapistProfile"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TherapistProfile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"TherapistProfile"> | Date | string
  }

  export type PatientProfileCreateInput = {
    id?: string
    userId: string
    userName?: string | null
    bio?: string | null
    timezone?: string
    languagePreference?: string
    fcmToken?: string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: string | null
    email?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PatientProfileUncheckedCreateInput = {
    id?: string
    userId: string
    userName?: string | null
    bio?: string | null
    timezone?: string
    languagePreference?: string
    fcmToken?: string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: string | null
    email?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PatientProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PatientProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PatientProfileCreateManyInput = {
    id?: string
    userId: string
    userName?: string | null
    bio?: string | null
    timezone?: string
    languagePreference?: string
    fcmToken?: string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: string | null
    email?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PatientProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PatientProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TherapistProfileCreateInput = {
    id?: string
    userId: string
    userName?: string | null
    bio?: string | null
    timezone?: string
    languagePreference?: string
    specialisation?: string | null
    languages?: TherapistProfileCreatelanguagesInput | string[]
    isAcceptingPatients?: boolean
    photoUrl?: string | null
    fcmToken?: string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: string | null
    email?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TherapistProfileUncheckedCreateInput = {
    id?: string
    userId: string
    userName?: string | null
    bio?: string | null
    timezone?: string
    languagePreference?: string
    specialisation?: string | null
    languages?: TherapistProfileCreatelanguagesInput | string[]
    isAcceptingPatients?: boolean
    photoUrl?: string | null
    fcmToken?: string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: string | null
    email?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TherapistProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    specialisation?: NullableStringFieldUpdateOperationsInput | string | null
    languages?: TherapistProfileUpdatelanguagesInput | string[]
    isAcceptingPatients?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TherapistProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    specialisation?: NullableStringFieldUpdateOperationsInput | string | null
    languages?: TherapistProfileUpdatelanguagesInput | string[]
    isAcceptingPatients?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TherapistProfileCreateManyInput = {
    id?: string
    userId: string
    userName?: string | null
    bio?: string | null
    timezone?: string
    languagePreference?: string
    specialisation?: string | null
    languages?: TherapistProfileCreatelanguagesInput | string[]
    isAcceptingPatients?: boolean
    photoUrl?: string | null
    fcmToken?: string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: string | null
    email?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TherapistProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    specialisation?: NullableStringFieldUpdateOperationsInput | string | null
    languages?: TherapistProfileUpdatelanguagesInput | string[]
    isAcceptingPatients?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TherapistProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    timezone?: StringFieldUpdateOperationsInput | string
    languagePreference?: StringFieldUpdateOperationsInput | string
    specialisation?: NullableStringFieldUpdateOperationsInput | string | null
    languages?: TherapistProfileUpdatelanguagesInput | string[]
    isAcceptingPatients?: BoolFieldUpdateOperationsInput | boolean
    photoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    fcmToken?: NullableStringFieldUpdateOperationsInput | string | null
    notificationPreferences?: JsonNullValueInput | InputJsonValue
    role?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type PatientProfileCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    bio?: SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    fcmToken?: SortOrder
    notificationPreferences?: SortOrder
    role?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PatientProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    bio?: SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    fcmToken?: SortOrder
    role?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PatientProfileMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    bio?: SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    fcmToken?: SortOrder
    role?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type TherapistProfileCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    bio?: SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    specialisation?: SortOrder
    languages?: SortOrder
    isAcceptingPatients?: SortOrder
    photoUrl?: SortOrder
    fcmToken?: SortOrder
    notificationPreferences?: SortOrder
    role?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TherapistProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    bio?: SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    specialisation?: SortOrder
    isAcceptingPatients?: SortOrder
    photoUrl?: SortOrder
    fcmToken?: SortOrder
    role?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TherapistProfileMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    bio?: SortOrder
    timezone?: SortOrder
    languagePreference?: SortOrder
    specialisation?: SortOrder
    isAcceptingPatients?: SortOrder
    photoUrl?: SortOrder
    fcmToken?: SortOrder
    role?: SortOrder
    email?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type TherapistProfileCreatelanguagesInput = {
    set: string[]
  }

  export type TherapistProfileUpdatelanguagesInput = {
    set?: string[]
    push?: string | string[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NestedUuidFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedUuidWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedUuidWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}