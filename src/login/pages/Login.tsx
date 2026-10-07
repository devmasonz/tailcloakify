import { useEffect, useReducer, useState } from "react";
import { kcSanitize } from "keycloakify/lib/kcSanitize";
import { assert } from "keycloakify/tools/assert";
import { clsx } from "keycloakify/tools/clsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { getKcClsx, type KcClsx } from "keycloakify/login/lib/kcClsx";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import useProviderLogos from "../useProviderLogos";
import { useScript } from "keycloakify/login/pages/Login.useScript";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { social, realm, url, usernameHidden, login, auth, registrationDisabled, messagesPerField, enableWebAuthnConditionalUI, authenticators } =
        kcContext;

    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const providerLogos = useProviderLogos();
    const socialProviders = [...(social?.providers ?? [])].sort(
        (a, b) => Number(b.providerId === "google" || b.alias === "google") - Number(a.providerId === "google" || a.alias === "google")
    );
    const hasSocialProviders = socialProviders.length !== 0;
    const showPasswordForm = realm.password && kcContext.properties["TAILCLOAKIFY_HIDE_LOGIN_FORM"]?.toUpperCase() !== "TRUE";

    const webAuthnButtonId = "authenticateWebAuthnButton";

    useScript({ webAuthnButtonId, kcContext, i18n });

    return (
        <Template
            kcContext={kcContext}
            i18n={i18n}
            doUseDefaultCss={doUseDefaultCss}
            classes={classes}
            displayMessage={!messagesPerField.existsError("username", "password")}
            headerNode={msg("loginAccountTitle")}
            displayInfo={realm.password && realm.registrationAllowed && !registrationDisabled}
            infoNode={
                <div id="kc-registration-container" className={"space-y-4"}>
                    <div id="kc-registration" className={"text-center"}>
                        <span>
                            {msg("noAccount")}{" "}
                            <a
                                href={url.registrationUrl}
                                className={"text-primary-600 hover:text-primary-500 inline-flex no-underline hover:no-underline"}
                            >
                                {msg("doRegister")}
                            </a>
                        </span>
                    </div>
                </div>
            }
        >
            {hasSocialProviders && (
                <div id="kc-social-providers" className={clsx(kcClsx("kcFormSocialAccountSectionClass"), "mb-6")}>
                    <ul className={clsx(kcClsx("kcFormSocialAccountListClass"), "m-0 flex list-none flex-col gap-3 p-0")}>
                        {socialProviders.map(p => {
                            const isGoogle = p.providerId === "google" || p.alias === "google";
                            const logo = providerLogos[p.providerId] ?? providerLogos[p.alias];

                            return (
                                <li key={p.alias}>
                                    <a
                                        id={"social-" + p.alias}
                                        className={clsx(
                                            kcClsx("kcFormSocialAccountListButtonClass"),
                                            "relative flex min-h-[48px] w-full items-center justify-center gap-3 rounded-md border px-4 py-2.5 text-sm font-medium no-underline transition-colors hover:no-underline focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2",
                                            isGoogle
                                                ? "border-primary-600 bg-primary-600 text-white shadow-sm hover:border-primary-700 hover:bg-primary-700 hover:text-white"
                                                : "border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900"
                                        )}
                                        href={p.loginUrl}
                                    >
                                        {logo ? (
                                            <span
                                                className={clsx(
                                                    "flex shrink-0 items-center justify-center",
                                                    isGoogle ? "h-8 w-8 rounded bg-white" : "h-6 w-6"
                                                )}
                                                aria-hidden="true"
                                            >
                                                <img src={logo} alt="" className="h-5 w-5 object-contain" />
                                            </span>
                                        ) : p.iconClasses ? (
                                            <i className={clsx(kcClsx("kcCommonLogoIdP"), p.iconClasses, "text-xl")} aria-hidden="true" />
                                        ) : null}
                                        <span>{msg("continueWithProvider", isGoogle ? "Google" : p.displayName || p.alias)}</span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                    {showPasswordForm && <div className="separate mt-6 text-sm text-secondary-500">{msg("loginMethodSeparator")}</div>}
                </div>
            )}
            {showPasswordForm && (
                <div id="kc-form">
                    <div id="kc-form-wrapper" className={"space-y-4"}>
                        {realm.password && (
                            <form
                                id="kc-form-login"
                                onSubmit={() => {
                                    setIsLoginButtonDisabled(true);
                                    return true;
                                }}
                                action={url.loginAction}
                                method="post"
                                className={"m-0 space-y-4"}
                            >
                                {!usernameHidden && (
                                    <div className={kcClsx("kcFormGroupClass")}>
                                        <label
                                            htmlFor="username"
                                            className={clsx(kcClsx("kcLabelClass"), "block text-sm font-medium text-secondary-700")}
                                        >
                                            {!realm.loginWithEmailAllowed
                                                ? msg("username")
                                                : !realm.registrationEmailAsUsername
                                                  ? msg("usernameOrEmail")
                                                  : msg("email")}
                                        </label>
                                        <input
                                            id="username"
                                            className={clsx(
                                                kcClsx("kcInputClass"),
                                                "block min-h-[44px] border border-secondary-200 mt-1 rounded-md w-full px-3 py-2 text-sm focus:outline-none focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                            )}
                                            name="username"
                                            defaultValue={login.username ?? ""}
                                            type="text"
                                            autoFocus={!hasSocialProviders || messagesPerField.existsError("username", "password")}
                                            autoComplete="username"
                                            aria-invalid={messagesPerField.existsError("username", "password")}
                                        />
                                        {messagesPerField.existsError("username", "password") && (
                                            <span
                                                id="input-error"
                                                className={kcClsx("kcInputErrorMessageClass")}
                                                aria-live="polite"
                                                dangerouslySetInnerHTML={{
                                                    __html: kcSanitize(messagesPerField.getFirstError("username", "password"))
                                                }}
                                            />
                                        )}
                                    </div>
                                )}

                                <div className={clsx(kcClsx("kcFormGroupClass"), "relative")}>
                                    <label
                                        htmlFor="password"
                                        className={clsx(kcClsx("kcLabelClass"), "block text-sm font-medium text-secondary-700")}
                                    >
                                        {msg("password")}
                                    </label>
                                    <PasswordWrapper kcClsx={kcClsx} i18n={i18n} passwordInputId="password">
                                        <input
                                            id="password"
                                            className={clsx(
                                                kcClsx("kcInputClass"),
                                                "block min-h-[44px] border border-secondary-200 mt-1 rounded-md w-full pl-3 pr-12 py-2 text-sm focus:outline-none focus:ring focus:ring-primary-200 focus:border-primary-300 focus:ring-opacity-50"
                                            )}
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            aria-invalid={messagesPerField.existsError("username", "password")}
                                        />
                                    </PasswordWrapper>
                                    {usernameHidden && messagesPerField.existsError("username", "password") && (
                                        <span
                                            id="input-error"
                                            className={kcClsx("kcInputErrorMessageClass")}
                                            aria-live="polite"
                                            dangerouslySetInnerHTML={{
                                                __html: kcSanitize(messagesPerField.getFirstError("username", "password"))
                                            }}
                                        />
                                    )}
                                </div>

                                {((realm.rememberMe && !usernameHidden) || realm.resetPasswordAllowed) && (
                                    <div className={kcClsx("kcFormGroupClass", "kcFormSettingClass")}>
                                        <div id="kc-form-options">
                                            {realm.rememberMe && !usernameHidden && (
                                                <div className="checkbox">
                                                    <label>
                                                        <input
                                                            id="rememberMe"
                                                            name="rememberMe"
                                                            type="checkbox"
                                                            className={"accent-primary-600"}
                                                            defaultChecked={!!login.rememberMe}
                                                        />{" "}
                                                        {msg("rememberMe")}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                        <div className={kcClsx("kcFormOptionsWrapperClass")}>
                                            {realm.resetPasswordAllowed && (
                                                <span>
                                                    <a
                                                        href={url.loginResetCredentialsUrl}
                                                        className={
                                                            "text-primary-600 hover:text-primary-500 inline-flex no-underline hover:no-underline"
                                                        }
                                                    >
                                                        {msg("doForgotPassword")}
                                                    </a>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div id="kc-form-buttons" className={clsx(kcClsx("kcFormGroupClass"), "flex flex-col space-y-2")}>
                                    <input type="hidden" id="id-hidden-input" name="credentialId" value={auth.selectedCredential} />
                                    <input
                                        disabled={isLoginButtonDisabled}
                                        className={clsx(
                                            "min-h-[44px] rounded-md border px-4 py-2 text-sm font-medium flex justify-center relative w-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                                            hasSocialProviders
                                                ? "border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 focus:ring-secondary-400"
                                                : "border-primary-600 bg-primary-600 text-white focus:ring-primary-600 hover:bg-primary-700"
                                        )}
                                        name="login"
                                        id="kc-login"
                                        type="submit"
                                        value={msgStr("signInWithPassword")}
                                    />
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
            {enableWebAuthnConditionalUI && (
                <>
                    <form id="webauth" action={url.loginAction} method="post">
                        <input type="hidden" id="clientDataJSON" name="clientDataJSON" />
                        <input type="hidden" id="authenticatorData" name="authenticatorData" />
                        <input type="hidden" id="signature" name="signature" />
                        <input type="hidden" id="credentialId" name="credentialId" />
                        <input type="hidden" id="userHandle" name="userHandle" />
                        <input type="hidden" id="error" name="error" />
                    </form>

                    {authenticators !== undefined && authenticators.authenticators.length !== 0 && (
                        <>
                            <form id="authn_select" className={kcClsx("kcFormClass")}>
                                {authenticators.authenticators.map((authenticator, i) => (
                                    <input key={i} type="hidden" name="authn_use_chk" readOnly value={authenticator.credentialId} />
                                ))}
                            </form>
                        </>
                    )}

                    <input
                        id={webAuthnButtonId}
                        type="button"
                        className={
                            "rounded-md text-primary-600 border-2 border-primary-600 border-solid px-4 py-2 text-sm flex justify-center relative w-full mt-4 no-underline hover:no-underline hover:border-3 hover:text-primary-300"
                        }
                        value={msgStr("passkey-doAuthenticate")}
                    />
                </>
            )}
        </Template>
    );
}

function PasswordWrapper(props: { kcClsx: KcClsx; i18n: I18n; passwordInputId: string; children: JSX.Element }) {
    const { kcClsx, i18n, passwordInputId, children } = props;

    const { msgStr } = i18n;

    const [isPasswordRevealed, toggleIsPasswordRevealed] = useReducer((isPasswordRevealed: boolean) => !isPasswordRevealed, false);

    useEffect(() => {
        const passwordInputElement = document.getElementById(passwordInputId);

        assert(passwordInputElement instanceof HTMLInputElement);

        passwordInputElement.type = isPasswordRevealed ? "text" : "password";
    }, [isPasswordRevealed]);

    return (
        <div className={kcClsx("kcInputGroup")}>
            {children}
            <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-xl text-secondary-400 hover:text-secondary-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-600"
                aria-label={msgStr(isPasswordRevealed ? "hidePassword" : "showPassword")}
                aria-controls={passwordInputId}
                onClick={toggleIsPasswordRevealed}
            >
                <i
                    className={clsx(kcClsx(isPasswordRevealed ? "kcFormPasswordVisibilityIconHide" : "kcFormPasswordVisibilityIconShow"), "h-5 w-5")}
                    aria-hidden={true}
                />
            </button>
        </div>
    );
}
