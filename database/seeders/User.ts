import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
import {
  BukuFactory,
  BukuKeluarFactory,
  BukuMasukFactory,
  JurusanFactory,
  RoleFactory,
  UserFactory,
} from "Database/factories";

export default class UserSeeder extends BaseSeeder {
  public async run() {
    await JurusanFactory.merge([
      { nama: "Akomodasi Perhotelan" },
      { nama: "Usaha Perjalanan Wisata" },
      { nama: "Tata Boga" },
      { nama: "Tata Busana" },
      { nama: "Desain Fesyen" },
      { nama: "Kecantikan Kulit dan Rambut" },
      { nama: "Teknik Komputer dan Jaringan" },
      { nama: "Rekayasa Perangkat Lunak" },
      { nama: "Multimedia" },
    ]).createMany(9);

    await RoleFactory.merge([
      { id: 1, nama: "ADMIN" },
      { id: 2, nama: "ANGGOTA" },
    ]).createMany(2);

    const AMOUNT = 30;
    await UserFactory.with("profil").createMany(AMOUNT);

    const buku = await BukuFactory.createMany(AMOUNT);
    const bookIds = buku.map(({ id }) => id);
    await Promise.all(
      bookIds.map(async (id) => {
        await BukuKeluarFactory.merge({ idBuku: id }).create();
        await BukuMasukFactory.merge({ idBuku: id }).create();
      })
    );
  }
}
