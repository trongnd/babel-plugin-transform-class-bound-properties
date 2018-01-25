# babel-plugin-transform-class-bound-properties

> This plugin transforms class bound properties
> with hot reloading supported

## Installation

### Via `npm`
```sh
npm install --save-dev babel-plugin-transform-class-bound-properties
```

### Via `yarn`
```sh
yarn add --dev babel-plugin-transform-class-bound-properties
```

## Usage

Please make sure `transform-class-bound-properties` is listed before `transform-class-properties`.

### Via `.babelrc` (Recommended)

**.babelrc**

```json
# this will enable the plugin in dev mode only (process.env.NODE_ENV !== 'production')
{
  "plugins": ["transform-class-bound-properties"]
}
```

```json
# this will enable the plugin in both dev mode and production mode
{
  "plugins": ["transform-class-bound-properties", { "production": true }]
}
```

### Via CLI

```sh
babel --plugins transform-class-bound-properties script.js
```

### Via CLI

```js
require("babel-core").transform("code", {
  plugins: ["transform-class-bound-properties"]
})
```

### Important Note

Editing the `.babelrc` won't actually change the setup, unless you start the packager with yarn start `--reset-cache` to clean the transform cache.

## Why?

Hot module reload (HMR) [has been broken for class bound properties](https://github.com/facebook/react-native/issues/15363) in React Native.

The "hot loading" message appears, but the changes don't show up.

```js
import React from 'react';
import {View, Text} from 'react-native';

export default class HotReloadingTest extends React.Component {
  constructor(props) {
    super(props);

    this.manualBind = this.manualBind.bind(this);
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20}}>
        <View style={{flex: 1, backgroundColor: 'rgba(0, 255, 0, 0.1)'}}>
          {this.manualBind()}
        </View>
        <View style={{flex: 1, backgroundColor: 'rgba(255, 0, 0, 0.1)'}}>
          {this.autoBind()}
        </View>
      </View>
    );
  }

  manualBind() {
    // changes in this "manualBind" method shows up as usual

    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Manual reloads fine</Text>
      </View>
    );
  }

  autoBind = () => {
    // changes in this "autoBind" method don't show up

    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Auto doesn’t hot reload</Text>
      </View>
    );
  }
}
```

![HotReloadingTest](https://user-images.githubusercontent.com/721323/28952150-b2ad49b4-7912-11e7-9b99-d77b85293d45.gif)

## How it works?

This plugin transform *a bound property* into *a corresponding unbound class method* and *a bind statement in `constructor`* (same as `manualBind` method in the sample code above)

```js
  class SomeClass {
    boundFn1 = () => {
      return this.field1
    }

    boundFn2 = ({ value }) => this.field2 + value

    asyncBoundFn1 = async () => {
      return await this.field1
    }
  }

  # will be transformed to

  class SomeClass {
    constructor() {
      this.boundFn1 = this.boundFn1.bind(this)
      this.boundFn2 = this.boundFn2.bind(this)
      this.asyncBoundFn = this.asyncBoundFn.bind(this)
    }

    boundFn1() {
      return this.field1
    }

    boundFn2({ value }) {
      return this.field2 + value
    }

    async asyncBoundFn() {
      return await this.someFn()
    }
  }
```

***NOTE:***

By default, this plugin transforms bound properties **only in DEV mode** (`process.env.NODE_ENV !== 'production'`).

In production mode (when you build the code for release), as we don't need hot reloading, the plugin doesn't transform anything, so bound properties will be transformed by the plugin `babel-plugin-transform-class-properties` as usual.

If you still want to enable this plugin for production mode, please set `production` option to `true`

```json
{
  "plugins": ["transform-class-bound-properties", { "production": true }]
}
```
