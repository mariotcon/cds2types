import { Token } from "../utils/type.constants";
import {
    IDefinition,
    CDSType,
    IElement,
    CDSCardinality,
    CDSKind,
} from "../utils/cds";
import { BaseType } from "./base.type";
import { Enum } from "./enum";
import { fork } from "cluster";

/**
 * Type that represents a CDS entity.
 *
 * Will be converted into a Typescript interface.
 *
 * @export
 * @class Entity
 * @extends {BaseType}
 */
export class Entity extends BaseType<Entity> {
    /**
     * Default constructor.
     * @param {string} name Name of the entity
     * @param {IDefinition} definition CDS entity definition
     * @param {string} [prefix=""] Interface prefix
     * @memberof Entity
     */
    constructor(
        name: string,
        definition: IDefinition,
        prefix: string = "",
        namespace: string = ""
    ) {
        super(name, definition, prefix, namespace);
    }

    /**
     * Converts the entity to a Typescript type.
     *
     * @returns {string}
     * @memberof Entity
     */
    public toType(types: Entity[]): string {
        let result = "";

        const ext = this.getExtensionInterfaces(types);
        const extFields = this.getExtensionInterfaceFields(types);

        let code: string[] = [];
        let enumCode: string[] = [];

        code.push(this.createInterface(ext));
        if (this.definition.elements) {
            for (const [key, value] of this.definition.elements) {
                if (value.enum) {
                    const enumName =
                        this.sanitizeName(this.sanitizeTarget(this.name)) +
                        this.sanitizeName(key);
                    const definition: IDefinition = {
                        kind: CDSKind.type,
                        type: value.type,
                        enum: value.enum,
                    };

                    const enumType = new Enum(enumName, definition);
                    enumCode.push(enumType.toType());

                    code.push(
                        this.createInterfaceField(key, value, this.prefix)
                    );
                } else {
                    if (!extFields.includes(key)) {
                        code.push(
                            this.createInterfaceField(key, value, this.prefix)
                        );

                        if (
                            value.cardinality &&
                            value.cardinality.max === CDSCardinality.one
                        ) {
                            code.push(
                                ...this.getAssociationRefField(
                                    types,
                                    key,
                                    "_",
                                    value
                                )
                            );
                        }
                    }
                }
            }
        }
        code.push(`${Token.curlyBraceRight}`);

        result =
            enumCode.length > 0
                ? enumCode.join(this.joiner) +
                  this.joiner +
                  code.join(this.joiner)
                : code.join(this.joiner);

        return this.joiner + result;
    }

    /**
     * Returns the sanitized name of the entity.
     *
     * @returns {string} Sanitized name of the entity
     * @memberof Entity
     */
    public getSanitizedName(
        withPrefix: boolean = false,
        withNamespace: boolean = false
    ): string {
        let name = this.sanitizeName(this.sanitizeTarget(this.name));

        if (withPrefix) {
            name = this.prefix + name;
        }

        if (withNamespace && (this.namespace || this.namespace !== "")) {
            name = this.namespace + "." + name;
        }

        return name;
    }

    /**
     * Returns the model name of the entity.
     *
     * @returns {string} Model name of the entity
     * @memberof Entity
     */
    public getModelName(): string {
        return this.name;
    }

    /**
     * Returns the fields of the entity.
     *
     * @returns {string[]} List of all field names
     * @memberof Entity
     */
    public getFields(): string[] {
        let result: string[] = [];

        if (this.definition.elements) {
            result = Array.from(this.definition.elements.keys());
        }

        return result;
    }

    /**
     * Returns all interfaces that this entity extends from
     *
     * @private
     * @param {Entity[]} types All other entity types
     * @returns {(string[] | undefined)} List of all extended types
     * @memberof Entity
     */
    private getExtensionInterfaces(types: Entity[]): string[] | undefined {
        let result: string[] | undefined = undefined;

        if (this.definition.includes) {
            const entities = types.filter(e =>
                this.definition.includes
                    ? this.definition.includes.includes(e.name)
                    : false
            );

            if (entities) {
                result = entities.map(e => e.getSanitizedName(true, true));
            }
        }

        return result;
    }

    /**
     * Returns all fields from the extended interfaces.
     *
     * @private
     * @param {Entity[]} types All other entity types
     * @returns {string[]} List of all fields
     * @memberof Entity
     */
    private getExtensionInterfaceFields(types: Entity[]): string[] {
        let result: string[] = [];

        if (this.definition.includes) {
            const entities = types.filter(e =>
                this.definition.includes
                    ? this.definition.includes.includes(e.name)
                    : false
            );
            if (entities) {
                for (const entity of entities) {
                    result.push(...entity.getFields());
                }
            }
        }

        return result;
    }

    private getAssociationRefField(
        types: Entity[],
        name: string,
        suffix: string,
        element: IElement
    ): string[] {
        let result: string[] = [];

        if (element.target && element.keys) {
            const entity = types.find(t => element.target === t.getModelName());
            if (entity && entity.definition.elements) {
                for (const key of element.keys) {
                    for (const [k, v] of entity.definition.elements) {
                        if (k === key.ref[0]) {
                            const line = `    ${name}${suffix}${k}${
                                Token.questionMark
                            }${Token.colon} ${this.cdsTypeToType(v.type)}${
                                Token.semiColon
                            }`;
                            result.push(line);

                            break;
                        }
                    }
                }
            }
        }

        return result;
    }
}
