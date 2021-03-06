# cds2types

[![npm version](https://badge.fury.io/js/cds2types.svg)](https://badge.fury.io/js/cds2types) [![Actions Status](https://github.com/mrbandler/cds2types/workflows/build/badge.svg)](https://github.com/mrbandler/cds2types/actions) [![GitHub License](https://img.shields.io/github/license/mrbandler/cds2types)](https://github.com/mrbandler/cds2types/blob/master/LICENSE)

**CLI to convert CDS definitions to native Typescript types.**

## Table of Content

1. [Installation](#1-installation) 💻
2. [Usage](#2-usage) ⌨️
3. [Bugs and Features](#4-bugs-and-features) 🐞💡
4. [License](#5-license) 📃

## 1. Installation

```bash
$ npm install cds2types
```

OR

```bash
$ yarn add cds2types
```

## 2. Usage

Let's look at a CDS example:

```cds
// schema.cds

using { Currency, managed, sap } from '@sap/cds/common';
namespace sap.capire.bookshop;

entity Books : managed {
  key ID : Integer;
  title  : localized String(111);
  descr  : localized String(1111);
  author : Association to Authors;
  genre  : Association to Genres;
  stock  : Integer;
  price  : Decimal(9,2);
  currency : Currency;
}

entity Authors : managed {
  key ID : Integer;
  name   : String(111);
  dateOfBirth  : Date;
  dateOfDeath  : Date;
  placeOfBirth : String;
  placeOfDeath : String;
  books  : Association to many Books on books.author = $self;
}

/** Hierarchically organized Code List for Genres */
entity Genres : sap.common.CodeList {
  key ID   : Integer;
  parent   : Association to Genres;
  children : Composition of many Genres on children.parent = $self;
}
```

```cds
// service.cds

using { sap.capire.bookshop as my } from './schema';
service CatalogService @(path:'/browse') {

  @readonly entity Books as SELECT from my.Books {*,
    author.name as author
  } excluding { createdBy, modifiedBy };

  @requires_: 'authenticated-user'
  action submitOrder (book : Books.ID, amount: Integer);
}
```

Now when we run the CLI:

```bash
$ cds2types --cds ./service.cds --output ./service.ts --prefix I
```

We get the following output:

```typescript
// service.ts

export namespace sap.capire.bookshop {
    export interface IAuthors extends IManaged {
        ID: number;
        name: string;
        dateOfBirth: Date;
        dateOfDeath: Date;
        placeOfBirth: string;
        placeOfDeath: string;
        books?: IBooks[];
    }
    export interface IBooks extends IManaged {
        ID: number;
        title: string;
        descr: string;
        author?: IAuthors;
        author_ID?: number;
        genre?: IGenres;
        genre_ID?: number;
        stock: number;
        price: number;
        currency: unknown;
        currency_code?: string;
    }
    export interface IGenres extends sap.common.ICodeList {
        ID: number;
        parent?: IGenres;
        parent_ID?: number;
        children: unknown;
    }
    export enum Entity {
        Authors = "sap.capire.bookshop.Authors",
        Books = "sap.capire.bookshop.Books",
        Genres = "sap.capire.bookshop.Genres",
    }
    export enum SanitizedEntity {
        Authors = "Authors",
        Books = "Books",
        Genres = "Genres",
    }
}
export namespace sap.common {
    export interface ICodeList {
        name: string;
        descr: string;
    }
    export interface ICountries extends sap.common.ICodeList {
        code: string;
    }
    export interface ICurrencies extends sap.common.ICodeList {
        code: string;
        symbol: string;
    }
    export interface ILanguages extends sap.common.ICodeList {
        code: string;
    }
    export enum Entity {
        CodeList = "sap.common.CodeList",
        Countries = "sap.common.Countries",
        Currencies = "sap.common.Currencies",
        Languages = "sap.common.Languages",
    }
    export enum SanitizedEntity {
        CodeList = "CodeList",
        Countries = "Countries",
        Currencies = "Currencies",
        Languages = "Languages",
    }
}
export namespace CatalogService {
    export enum ActionSubmitOrder {
        name = "submitOrder",
        paramBook = "book",
        paramAmount = "amount",
    }
    export interface IActionSubmitOrderParams {
        book: unknown;
        amount: number;
    }
    export interface IBooks {
        createdAt?: Date;
        modifiedAt?: Date;
        ID: number;
        title: string;
        descr: string;
        author: string;
        genre?: IGenres;
        genre_ID?: number;
        stock: number;
        price: number;
        currency: unknown;
        currency_code?: string;
    }
    export interface ICurrencies {
        name: string;
        descr: string;
        code: string;
        symbol: string;
    }
    export interface IGenres {
        name: string;
        descr: string;
        ID: number;
        parent?: IGenres;
        parent_ID?: number;
        children: unknown;
    }
    export enum Entity {
        Books = "CatalogService.Books",
        Currencies = "CatalogService.Currencies",
        Genres = "CatalogService.Genres",
    }
    export enum SanitizedEntity {
        Books = "Books",
        Currencies = "Currencies",
        Genres = "Genres",
    }
}
export interface IUser {}
export interface ICuid {
    ID: string;
}
export interface IManaged {
    createdAt?: Date;
    createdBy?: string;
    modifiedAt?: Date;
    modifiedBy?: string;
}
export interface ITemporal {
    validFrom: Date;
    validTo: Date;
}
export enum Entity {
    User = "User",
    Cuid = "cuid",
    Managed = "managed",
    Temporal = "temporal",
}
export enum SanitizedEntity {
    User = "User",
    Cuid = "Cuid",
    Managed = "Managed",
    Temporal = "Temporal",
}
```

## 3. Bugs and Features

Please open a issue when you encounter any bugs 🐞 or if you have an idea for a additional feature 💡.

---

## 4. License

MIT License

Copyright (c) 2019 mrbandler

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
