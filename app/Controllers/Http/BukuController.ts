import Application from "@ioc:Adonis/Core/Application";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema } from "@ioc:Adonis/Core/Validator";
import { unlink } from "fs/promises";
import Buku from "App/Models/Buku";

const bookSchema = schema.create({
  isbn: schema.string({ trim: true }, [rules.required(), rules.maxLength(13)]),
  judul: schema.string({ trim: true }, [rules.required()]),
  pengarang: schema.string({ trim: true }, [rules.required()]),
  penerbit: schema.string({ trim: true }, [rules.required()]),
  deskripsi: schema.string({ trim: true }, [rules.required()]),
  cover: schema.file({ size: "2mb", extnames: ["png", "jpeg", "jpg"] }, [rules.required()]),
});

export default class BukuController {
  public async show({}: HttpContextContract) {
    const books = await Buku.all();

    return {
      data: books.map((book) => book.toJSON()),
    };
  }

  public async create({ request, response, session }: HttpContextContract) {
    const { isbn, judul, pengarang, deskripsi, penerbit, cover } = await request.validate({
      schema: bookSchema,
      messages: {
        required: "{{ field }} tidak boleh kosong!",
        maxLength: "Melebihi batas {{ options.maxLength }} karakter!",
      },
    });

    // save the file
    const filename = `${isbn}.${cover.extname}`;
    await cover.move(Application.publicPath("img/buku"), {
      name: filename,
    });

    await Buku.create({
      isbn,
      judul,
      pengarang,
      penerbit,
      deskripsi,
      jumlah: 0,
      url_cover: filename,
    });

    session.flash({ msg: `Buku berjudul ${judul} berhasil ditambahkan` });
    return response.redirect("/admin/dashboard/buku");
  }

  public async destroy({ request, response, session }: HttpContextContract) {
    /* eslint-disable-next-line */
    const { id_buku } = await request.validate({
      schema: schema.create({
        id_buku: schema.number([rules.required()]),
      }),
    });

    const buku = await Buku.find(id_buku);
    if (!buku) {
      session.flash({ error: `Tidak ada buku dengan id ${id_buku}` });
      return response.redirect().back();
    }

    await buku.delete();
    session.flash({ msg: `Buku ${buku.judul} berhasil dihapus!` });

    return response.redirect().back();
  }

  public async update({ request, response, session }: HttpContextContract) {
    /* eslint-disable-next-line */
    const { isbn, cover, judul, penerbit, deskripsi, pengarang } = await request.validate({
      schema: bookSchema,
    });
    const { id } = request.qs();

    const buku = await Buku.find(id);
    if (!buku) {
      session.flash({ error: `Tidak ada buku dengan id ${id}` });
      return response.redirect().back();
    }

    buku.isbn = isbn;
    buku.judul = judul;
    buku.pengarang = pengarang;
    buku.penerbit = penerbit;
    buku.deskripsi = deskripsi;

    if (cover) {
      // remove the old one
      await unlink(Application.publicPath(`img/buku/${buku.url_cover}`));

      // save the file
      const filename = `${isbn}.${cover.extname}`;
      await cover.move(Application.publicPath("img/buku"), {
        name: filename,
      });
      buku.url_cover = filename;
    }

    await buku.save();
    session.flash({ msg: `Buku ${buku.judul} berhasil diperbarui!` });

    return response.redirect("/admin/dashboard/buku");
  }
}
