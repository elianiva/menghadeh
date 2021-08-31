import Hash from "@ioc:Adonis/Core/Hash";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import User from "App/Models/User";
import { rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UsersController {
  public async index({ view }: HttpContextContract) {
    // TODO: redirect
    return view.render("admin/login");
  }

  public async dashboard({ response, view, auth }: HttpContextContract) {
    if (!auth.user) {
      return response.redirect("/admin/login");
    }
    return view.render("admin/dashboard", {
      user: auth.user.toJSON(),
    });
  }

  public async login({ request, response, session, auth }: HttpContextContract) {
    if (auth.user) {
      return response.redirect("/admin/dashboard");
    }

    const userSchema = schema.create({
      email: schema.string({ trim: true }, [rules.email(), rules.required()]),
      password: schema.string({ trim: true }, [rules.required()]),
      remember_me: schema.boolean.optional(),
    });

    try {
      /* eslint-disable */
      const { email, password, remember_me } = await request.validate({ schema: userSchema });

      const user = await User.findBy("email", email);
      if (!user) {
        session.flash({ error: `Tidak ada user dengan email ${email}` });
        return response.redirect("/admin/login");
      }

      await user.load("role");
      console.log(user.toJSON());
      if (user.role.nama !== "ADMIN") {
        session.flash({ error: "Anda bukan admin!" });
        return response.redirect("/admin/login");
      }

      const isPasswordMatch = await Hash.verify(user.password, password);
      if (!isPasswordMatch) {
        session.flash({ error: "Password yang anda masukkan salah!" });
        return response.redirect("/admin/login");
      }

      // await user.load("profil");
      // console.log(user.profil);
      await auth.use("web").login(user, remember_me);

      return response.redirect("/admin/dashboard");
    } catch (err) {
      console.error(err);
      return response.badRequest(err.messages);
    }
  }

  public async create({}: HttpContextContract) {}

  public async store({}: HttpContextContract) {}

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
