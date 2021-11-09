import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema } from "@ioc:Adonis/Core/Validator";
import TransaksiBuku from "App/Models/TransaksiBuku";

export interface AddParam {
  id_buku: number;
  jumlah: number;
  alasan: string;
}

export enum Kind {
  KELUAR = 0,
  MASUK,
}

export default class TransaksiBukuController {
  public async show({ request }: HttpContextContract) {
    const { kind } = request.qs();

    const buku = await TransaksiBuku.query().where(
      "jenis",
      kind === "masuk" ? Kind.MASUK : Kind.KELUAR
    );

    return {
      data: await Promise.all(
        buku!.map(async (b: TransaksiBuku) => {
          await b.load("buku");
          return {
            id: b.id,
            id_buku: b.buku.id,
            judul: b.buku.judul,
            alasan: b.alasan,
            jumlah: b.jumlah,
            created_at: b.createdAt,
            updated_at: b.updatedAt,
          };
        })
      ),
    };
  }

  public static async add(kind: Kind, { id_buku = 0, jumlah = 0, alasan = "" }: AddParam) {
    const transaksi = await TransaksiBuku.create({ idBuku: id_buku, alasan, jumlah, jenis: kind });

    if (kind === Kind.MASUK) transaksi.buku.jumlah = transaksi.buku.jumlah + jumlah;
    if (kind === Kind.KELUAR) transaksi.buku.jumlah = transaksi.buku.jumlah - jumlah;

    await transaksi.load("buku");

    // prevents negative value
    if (transaksi!.buku.jumlah < 0) transaksi!.buku.jumlah = 0;

    await transaksi!.buku.save();
  }

  public async create({ request, response, session }: HttpContextContract) {
    const { kind } = request.qs();

    /* eslint-disable */
    const { id_buku, alasan, jumlah } = await request.validate({
      schema: schema.create({
        id_buku: schema.number([rules.required()]),
        alasan: schema.string({ trim: true }, [rules.required()]),
        jumlah: schema.number([rules.required()]),
      }),
    });

    await TransaksiBukuController.add(kind === "masuk" ? Kind.MASUK : Kind.KELUAR, {
      id_buku,
      alasan,
      jumlah,
    });

    session.flash({ msg: `Berhasil menambahkan buku dengan alasan "${alasan}"` });
    return response.redirect().back();
  }

  public async update({ request, response, session }: HttpContextContract) {
    /* eslint-disable */
    const { id_buku, alasan, jumlah } = await request.validate({
      schema: schema.create({
        id_buku: schema.number([rules.required()]),
        alasan: schema.string({ trim: true }, [rules.required()]),
        jumlah: schema.number([rules.required()]),
      }),
    });

    const { kind } = request.qs();
    const buku = await TransaksiBuku.query()
      .where("jenis", kind === "masuk" ? Kind.MASUK : Kind.KELUAR)
      .first();

    if (!buku) {
      session.flash({ err: `Tidak ada buku keluar dengan id ${id_buku}` });
      return response.redirect().back();
    }

    await buku.load("buku");

    buku.alasan = alasan;

    if (kind === Kind.MASUK) {
      buku.buku.jumlah = buku.buku.jumlah - buku.jumlah + jumlah;
    } else if (kind === Kind.KELUAR) {
      buku.buku.jumlah = buku.buku.jumlah - buku.jumlah;
    }

    buku.jumlah = jumlah;
    buku.buku.save();
    buku.save();

    session.flash({ msg: `Berhasil memperbarui buku dengan judul "${buku.buku.judul}"` });
    return response.redirect().back();
  }

  public async destroy({ request, response, session }: HttpContextContract) {
    const { id_buku } = await request.validate({
      schema: schema.create({
        id_buku: schema.number([rules.required()]),
      }),
    });

    const { kind } = request.qs();
    const buku = await TransaksiBuku.query()
      .where("jenis", kind === "masuk" ? Kind.MASUK : Kind.KELUAR)
      .first();

    if (!buku) {
      session.flash({ err: `Tidak ada buku keluar dengan id ${id_buku}` });
      return response.redirect().back();
    }

    await buku.load("buku");

    if (kind === Kind.MASUK) {
      buku.buku.jumlah = buku.buku.jumlah + buku.jumlah;
    } else if (kind === Kind.KELUAR) {
      buku.buku.jumlah = buku.buku.jumlah + buku.jumlah;
    }

    buku.buku.save();
    buku.save();

    session.flash({ msg: `Berhasil memperbarui buku dengan judul "${buku.buku.judul}"` });
    return response.redirect().back();
  }
}
