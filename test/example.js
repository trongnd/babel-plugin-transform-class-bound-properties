class SomeClass {
  boundFn1 = () => {
    return this.field1
  }

  boundFn2 = ({ value }) => this.field2 + value

  asyncBoundFn1 = async () => {
    return await this.field1
  }
}
