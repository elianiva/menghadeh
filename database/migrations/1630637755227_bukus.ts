import BaseSchema from "@ioc:Adonis/Lucid/Schema";

export default class Bukus extends BaseSchema {
  protected tableName = "buku";

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments("id");
      table.timestamps(true, true);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
