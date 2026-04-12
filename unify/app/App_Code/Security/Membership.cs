using System;
using System.Configuration;
using System.Configuration.Provider;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Data;
using System.Data.Common;
using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.XPath;
using System.Web;
using System.Web.Configuration;
using System.Web.Security;
using FreeTrial.Data;

namespace FreeTrial.Security
{
    ///
    public enum MembershipProviderSqlStatement
    {

        ChangePassword,

        ChangePasswordQuestionAndAnswer,

        CreateUser,

        DeleteUser,

        CountAllUsers,

        GetAllUsers,

        GetNumberOfUsersOnline,

        GetPassword,

        GetUser,

        UpdateLastUserActivity,

        GetUserByProviderKey,

        UpdateUserLockStatus,

        GetUserNameByEmail,

        ResetPassword,

        UpdateUser,

        UpdateLastLoginDate,

        UpdateFailedPasswordAttempt,

        UpdateFailedPasswordAnswerAttempt,

        LockUser,

        CountUsersByName,

        FindUsersByName,

        CountUsersByEmail,

        FindUsersByEmail,
    }

    internal sealed class PostgresMembershipProvider : MembershipProvider
    {

        public static SortedDictionary<MembershipProviderSqlStatement, string> Statements = new SortedDictionary<MembershipProviderSqlStatement, string>();

        private int _newPasswordLength = 8;

        private string _validationKey;

        private ConnectionStringSettings _connectionStringSettings;

        private bool _writeExceptionsToEventLog;

        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _applicationName;

        private bool _enablePasswordReset;

        private bool _enablePasswordRetrieval;

        private bool _requiresQuestionAndAnswer;

        private bool _requiresUniqueEmail;

        private int _maxInvalidPasswordAttempts;

        private int _passwordAttemptWindow;

        private MembershipPasswordFormat _passwordFormat;

        private int _minRequiredNonAlphanumericCharacters;

        private int _minRequiredPasswordLength;

        private string _passwordStrengthRegularExpression;

        static PostgresMembershipProvider()
        {
            Statements[MembershipProviderSqlStatement.ChangePassword] = "update aspnet_users set password = @Password, last_password_changed_date = @LastPasswordChangedDate where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.ChangePasswordQuestionAndAnswer] = "update aspnet_users set password_question = @PasswordQuestion, password_answer = @PasswordAnswer where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.CreateUser] = @"insert into aspnet_users
(
   user_name
  ,password
  ,email
  ,password_question
  ,password_answer
  ,is_approved
  ,comments
  ,creation_date
  ,last_password_changed_date
  ,last_activity_date
  ,last_login_date
  ,is_locked_out
  ,last_locked_out_date
  ,pwd_attempt_count
  ,pwd_attempt_window_start
  ,pwd_ans_attempt_count
  ,pwd_ans_attempt_window_start
   ,user_id
    )
values(
   @UserName
  ,@Password
  ,@Email
  ,@PasswordQuestion
  ,@PasswordAnswer
  ,@IsApproved
  ,@Comments
  ,@CreationDate
  ,@LastPasswordChangedDate
  ,@LastActivityDate
  ,@LastLoginDate
  ,@IsLockedOut
  ,@LastLockedOutDate
  ,@FailedPwdAttemptCount
  ,@FailedPwdAttemptWindowStart
  ,@FailedPwdAnsAttemptCount
  ,@FailedPwdAnsAttemptWindowStart
   ,@UserId

)
";
            Statements[MembershipProviderSqlStatement.DeleteUser] = "delete from aspnet_users where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.CountAllUsers] = "select count(*) from aspnet_users";
            Statements[MembershipProviderSqlStatement.GetAllUsers] = @"select
   user_id UserID
  ,user_name UserName
  ,email Email
  ,password_question PasswordQuestion
  ,comments Comments
  ,is_approved IsApproved
  ,is_locked_out IsLockedOut
  ,creation_date CreationDate
  ,last_login_date LastLoginDate
  ,last_activity_date LastActivityDate
  ,last_password_changed_date LastPasswordChangedDate
  ,last_locked_out_date LastLockedOutDate
from aspnet_users
order by user_name asc";
            Statements[MembershipProviderSqlStatement.GetNumberOfUsersOnline] = "select count(*) from aspnet_users where last_activity_date >= @CompareDate";
            Statements[MembershipProviderSqlStatement.GetPassword] = @"select password Password, password_answer PasswordAnswer, is_locked_out IsLockedOut, is_approved IsApproved, is_locked_out IsLockedOut, pwd_attempt_window_start FailedPwdAttemptWindowStart, pwd_ans_attempt_window_start FailedPwdAnsAttemptWindowStart from aspnet_users where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.GetUser] = @"select
   user_id UserID
  ,user_name UserName
  ,email Email
  ,password_question PasswordQuestion
  ,comments Comments
  ,is_approved IsApproved
  ,is_locked_out IsLockedOut
  ,creation_date CreationDate
  ,last_login_date LastLoginDate
  ,last_activity_date LastActivityDate
  ,last_password_changed_date LastPasswordChangedDate
  ,last_locked_out_date LastLockedOutDate
  ,pwd_attempt_count FailedPwdAttemptCount
  ,pwd_attempt_window_start FailedPwdAttemptWindowStart
  ,pwd_ans_attempt_count FailedPwdAnsAttemptCount
  ,pwd_ans_attempt_window_start FailedPwdAnsAttemptWindowStart
from aspnet_users
where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.UpdateLastUserActivity] = "update aspnet_users set last_activity_date = @LastActivityDate where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.GetUserByProviderKey] = @"select
   user_id UserID
  ,user_name Username
  ,email Email
  ,password_question PasswordQuestion
  ,comments Comments
  ,is_approved IsApproved
  ,is_locked_out IsLockedOut
  ,creation_date CreationDate
  ,last_login_date LastLoginDate
  ,last_activity_date LastActivityDate
  ,last_password_changed_date LastPasswordChangedDate
  ,last_locked_out_date LastLockedOutDate
from aspnet_users
where user_id = @UserID
";
            Statements[MembershipProviderSqlStatement.UpdateUserLockStatus] = "update aspnet_users set is_locked_out = @IsLockedOut, last_locked_out_date = @LastLockedOutDate where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.GetUserNameByEmail] = "select user_name Username from aspnet_users where email = @Email";
            Statements[MembershipProviderSqlStatement.ResetPassword] = "update aspnet_users set password = @Password, last_password_changed_date = @LastPasswordChangedDate where user_name = @UserName and is_locked_out = @IsLockedOut";
            Statements[MembershipProviderSqlStatement.UpdateUser] = "update aspnet_users set email = @Email, comments = @Comments, is_approved = @IsApproved where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.UpdateLastLoginDate] = "update aspnet_users set last_login_date = @LastLoginDate, is_locked_out = @IsLockedOut where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.UpdateFailedPasswordAttempt] = "update aspnet_users set pwd_attempt_count = @FailedPwdAttemptCount, pwd_attempt_window_start = @FailedPwdAttemptWindowStart where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.UpdateFailedPasswordAnswerAttempt] = "update aspnet_users set pwd_ans_attempt_count = @FailedPwdAnsAttemptCount where user_name = @UserName";
            Statements[MembershipProviderSqlStatement.CountUsersByName] = "select count(*) from aspnet_users where user_name like @UserName";
            Statements[MembershipProviderSqlStatement.FindUsersByName] = @"select
   user_id UserID
  ,user_name Username
  ,email Email
  ,password_question PasswordQuestion
  ,comments Comments
  ,is_approved IsApproved
  ,is_locked_out IsLockedOut
  ,creation_date CreationDate
  ,last_login_date LastLoginDate
  ,last_activity_date LastActivityDate
  ,last_password_changed_date LastPasswordChangedDate
  ,last_locked_out_date LastLockedOutDate
from aspnet_users
where user_name like @UserName
order by user_name asc
";
            Statements[MembershipProviderSqlStatement.CountUsersByEmail] = "select count(*) from aspnet_users where email like @Email";
            Statements[MembershipProviderSqlStatement.FindUsersByEmail] = @"select
   user_id UserID
  ,user_name Username
  ,email Email
  ,password_question PasswordQuestion
  ,comments Comments
  ,is_approved IsApproved
  ,is_locked_out IsLockedOut
  ,creation_date CreationDate
  ,last_login_date LastLoginDate
  ,last_activity_date LastActivityDate
  ,last_password_changed_date LastPasswordChangedDate
  ,last_locked_out_date LastLockedOutDate
from aspnet_users
where email like @Email
order by user_name asc";
        }

        public ConnectionStringSettings ConnectionStringSettings
        {
            get
            {
                return _connectionStringSettings;
            }
        }

        public bool WriteExceptionsToEventLog
        {
            get
            {
                return _writeExceptionsToEventLog;
            }
        }

        public override string ApplicationName
        {
            get
            {
                return _applicationName;
            }
            set
            {
                _applicationName = value;
            }
        }

        public override bool EnablePasswordReset
        {
            get
            {
                return _enablePasswordReset;
            }
        }

        public override bool EnablePasswordRetrieval
        {
            get
            {
                return _enablePasswordRetrieval;
            }
        }

        public override bool RequiresQuestionAndAnswer
        {
            get
            {
                return _requiresQuestionAndAnswer;
            }
        }

        public override bool RequiresUniqueEmail
        {
            get
            {
                return _requiresUniqueEmail;
            }
        }

        public override int MaxInvalidPasswordAttempts
        {
            get
            {
                return _maxInvalidPasswordAttempts;
            }
        }

        public override int PasswordAttemptWindow
        {
            get
            {
                return _passwordAttemptWindow;
            }
        }

        public override MembershipPasswordFormat PasswordFormat
        {
            get
            {
                return _passwordFormat;
            }
        }

        public override int MinRequiredNonAlphanumericCharacters
        {
            get
            {
                return _minRequiredNonAlphanumericCharacters;
            }
        }

        public override int MinRequiredPasswordLength
        {
            get
            {
                return _minRequiredPasswordLength;
            }
        }

        public override string PasswordStrengthRegularExpression
        {
            get
            {
                return _passwordStrengthRegularExpression;
            }
        }

        public MembershipPasswordFormat DefaultPasswordFormat
        {
            get
            {
                return MembershipPasswordFormat.Hashed;
            }
        }

        private SqlStatement CreateSqlStatement(MembershipProviderSqlStatement command)
        {
            var sql = new SqlText(Statements[command], ConnectionStringSettings.Name);
            sql.Command.CommandText = sql.Command.CommandText.Replace("@", sql.ParameterMarker);
            if (sql.Command.CommandText.Contains((sql.ParameterMarker + "ApplicationName")))
                sql.AssignParameter("ApplicationName", ApplicationName);
            sql.Name = ("FreeTrial Application Membership Provider - " + command.ToString());
            sql.WriteExceptionsToEventLog = WriteExceptionsToEventLog;
            return sql;
        }

        private string GetConfigValue(string configValue, string defaultValue)
        {
            if (string.IsNullOrEmpty(configValue))
                return defaultValue;
            return configValue;
        }

        public override void Initialize(string name, NameValueCollection config)
        {
            if (config == null)
                throw new ArgumentNullException("config");
            if (string.IsNullOrEmpty(name))
                name = "PostgresMembershipProvider";
            if (string.IsNullOrEmpty(config["description"]))
            {
                config.Remove("description");
                config.Add("description", "FreeTrial application membership provider");
            }
            base.Initialize(name, config);
            _applicationName = config["applicationName"];
            if (string.IsNullOrEmpty(_applicationName))
                _applicationName = System.Web.Hosting.HostingEnvironment.ApplicationVirtualPath;
            _maxInvalidPasswordAttempts = Convert.ToInt32(GetConfigValue(config["maxInvalidPasswordAttempts"], "5"));
            _passwordAttemptWindow = Convert.ToInt32(GetConfigValue(config["passwordAttemptWindow"], "10"));
            _minRequiredNonAlphanumericCharacters = Convert.ToInt32(GetConfigValue(config["minRequiredNonAlphanumericCharacters"], "1"));
            _minRequiredPasswordLength = Convert.ToInt32(GetConfigValue(config["minRequiredPasswordLength"], "7"));
            _passwordStrengthRegularExpression = Convert.ToString(GetConfigValue(config["passwordStrengthRegularExpression"], string.Empty));
            _enablePasswordReset = Convert.ToBoolean(GetConfigValue(config["enablePasswordReset"], "true"));
            _enablePasswordRetrieval = Convert.ToBoolean(GetConfigValue(config["enablePasswordRetrieval"], "true"));
            _requiresQuestionAndAnswer = Convert.ToBoolean(GetConfigValue(config["requiresQuestionAndAnswer"], "false"));
            _requiresUniqueEmail = Convert.ToBoolean(GetConfigValue(config["requiresUniqueEmail"], "true"));
            _writeExceptionsToEventLog = Convert.ToBoolean(GetConfigValue(config["writeExceptionsToEventLog"], "false"));
            var pwdFormat = config["passwordFormat"];
            if (string.IsNullOrEmpty(pwdFormat))
                pwdFormat = DefaultPasswordFormat.ToString();
            if (pwdFormat == "Hashed")
                _passwordFormat = MembershipPasswordFormat.Hashed;
            else
            {
                if (pwdFormat == "Encrypted")
                    _passwordFormat = MembershipPasswordFormat.Encrypted;
                else
                {
                    if (pwdFormat == "Clear")
                        _passwordFormat = MembershipPasswordFormat.Clear;
                    else
                        throw new ProviderException("Password format is not supported.");
                }
            }
            _connectionStringSettings = ConfigurationManager.ConnectionStrings[config["connectionStringName"]];
            if ((_connectionStringSettings == null) || string.IsNullOrEmpty(_connectionStringSettings.ConnectionString))
                throw new ProviderException("Connection string cannot be blank.");
            _validationKey = ConfigurationManager.AppSettings["MembershipProviderValidationKey"];
            if (string.IsNullOrEmpty(_validationKey) || _validationKey.Contains("AutoGenerate"))
                _validationKey = "14B0948800CF423A4A0ECE0090826C8AD326387A53E89E9D181E23C60D605CEB3D403ECAEE62888574E04E7106425A2C5C379B76FCDF00026A3F00C5ED8B0C0D";
        }

        public override bool ChangePassword(string username, string oldPwd, string newPwd)
        {
            if (!ValidateUser(username, oldPwd))
                return false;
            var args = new ValidatePasswordEventArgs(username, newPwd, false);
            OnValidatingPassword(args);
            if (args.Cancel)
            {
                if (args.FailureInformation != null)
                    throw args.FailureInformation;
                else
                    throw new MembershipPasswordException("Change of password canceled due to new password validation failure.");
            }
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.ChangePassword))
            {
                sql.AssignParameter("Password", EncodePassword(newPwd));
                sql.AssignParameter("LastPasswordChangedDate", DateTime.Now);
                sql.AssignParameter("UserName", username);
                return (sql.ExecuteNonQuery() == 1);
            }
        }

        public override bool ChangePasswordQuestionAndAnswer(string username, string password, string newPwdQuestion, string newPwdAnswer)
        {
            if (!ValidateUser(username, password))
                return false;
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.ChangePasswordQuestionAndAnswer))
            {
                sql.AssignParameter("PasswordQuestion", newPwdQuestion);
                sql.AssignParameter("PasswordAnswer", EncodePassword(newPwdAnswer));
                sql.AssignParameter("UserName", username);
                return (sql.ExecuteNonQuery() == 1);
            }
        }

        public static string EncodeUserPassword(string password)
        {
            return ((PostgresMembershipProvider)(Membership.Provider)).EncodePassword(password);
        }

        public static void ValidateUserPassword(string username, string password)
        {
            ValidateUserPassword(username, password, true);
        }

        public static void ValidateUserPassword(string username, string password, bool isNewUser)
        {
            var args = new ValidatePasswordEventArgs(username, password, isNewUser);
            ((PostgresMembershipProvider)(Membership.Provider)).OnValidatingPassword(args);
            if (args.Cancel)
            {
                if (args.FailureInformation != null)
                    throw args.FailureInformation;
            }
        }

        public override MembershipUser CreateUser(string username, string password, string email, string passwordQuestion, string passwordAnswer, bool isApproved, object providerUserKey, out MembershipCreateStatus status)
        {
            var args = new ValidatePasswordEventArgs(username, password, true);
            OnValidatingPassword(args);
            if (args.Cancel)
            {
                status = MembershipCreateStatus.InvalidPassword;
                return null;
            }
            if (RequiresUniqueEmail && !string.IsNullOrEmpty(GetUserNameByEmail(email)))
            {
                status = MembershipCreateStatus.DuplicateEmail;
                return null;
            }
            if (GetUser(username, false) != null)
                status = MembershipCreateStatus.DuplicateUserName;
            else
            {
                var creationDate = DateTime.Now;
                using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.CreateUser))
                {
                    sql.AssignParameter("UserId", Guid.NewGuid());
                    sql.AssignParameter("UserName", username);
                    sql.AssignParameter("Password", EncodePassword(password));
                    sql.AssignParameter("Email", email);
                    sql.AssignParameter("PasswordQuestion", passwordQuestion);
                    sql.AssignParameter("PasswordAnswer", EncodePassword(passwordAnswer));
                    sql.AssignParameter("IsApproved", isApproved);
                    sql.AssignParameter("Comments", string.Empty);
                    sql.AssignParameter("CreationDate", creationDate);
                    sql.AssignParameter("LastPasswordChangedDate", creationDate);
                    sql.AssignParameter("LastActivityDate", creationDate);
                    sql.AssignParameter("LastLoginDate", creationDate);
                    sql.AssignParameter("IsLockedOut", false);
                    sql.AssignParameter("LastLockedOutDate", creationDate);
                    sql.AssignParameter("FailedPwdAttemptCount", 0);
                    sql.AssignParameter("FailedPwdAttemptWindowStart", creationDate);
                    sql.AssignParameter("FailedPwdAnsAttemptCount", 0);
                    sql.AssignParameter("FailedPwdAnsAttemptWindowStart", creationDate);
                    if (sql.ExecuteNonQuery() > 0)
                    {
                        status = MembershipCreateStatus.Success;
                        return GetUser(username, false);
                    }
                    else
                        status = MembershipCreateStatus.UserRejected;
                }
            }
            return null;
        }

        public override bool DeleteUser(string username, bool deleteAllRelatedData)
        {
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.DeleteUser))
            {
                sql.AssignParameter("UserName", username);
                return (sql.ExecuteNonQuery() > 0);
            }
        }

        public override MembershipUserCollection GetAllUsers(int pageIndex, int pageSize, out int totalRecords)
        {
            totalRecords = 0;
            var users = new MembershipUserCollection();
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.CountAllUsers))
            {
                totalRecords = Convert.ToInt32(sql.ExecuteScalar());
                if (totalRecords <= 0)
                    return users;
            }
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetAllUsers))
            {
                var counter = 0;
                var startIndex = (pageSize * pageIndex);
                var endIndex = ((startIndex + pageSize) - 1);
                while (sql.Read())
                {
                    if (counter >= startIndex)
                        users.Add(GetUser(sql));
                    if (counter >= endIndex)
                        break;
                    counter++;
                }
            }
            return users;
        }

        public override int GetNumberOfUsersOnline()
        {
            var onlineSpan = new TimeSpan(0, Membership.UserIsOnlineTimeWindow, 0);
            var compareDate = DateTime.Now.Subtract(onlineSpan);
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetNumberOfUsersOnline))
            {
                sql.AssignParameter("CompareDate", compareDate);
                return Convert.ToInt32(sql.ExecuteScalar());
            }
        }

        public override string GetPassword(string username, string answer)
        {
            if (!EnablePasswordRetrieval)
                throw new ProviderException("Password retrieval is not enabled.");
            if (PasswordFormat == MembershipPasswordFormat.Hashed)
                throw new ProviderException("Cannot retrieve hashed passwords.");
            var password = string.Empty;
            var passwordAnswer = string.Empty;
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetPassword))
            {
                sql.AssignParameter("UserName", username);
                if (sql.Read())
                {
                    if (Convert.ToBoolean(sql["IsLockedOut"]))
                        throw new MembershipPasswordException("User is locked out.");
                    password = Convert.ToString(sql["Password"]);
                    passwordAnswer = Convert.ToString(sql["PasswordAnswer"]);
                }
                else
                    throw new MembershipPasswordException("User name is not found.");
            }
            if (RequiresQuestionAndAnswer && !CheckPassword(answer, passwordAnswer))
            {
                UpdateFailureCount(username, "PasswordAnswer");
                throw new MembershipPasswordException("Incorrect password answer.");
            }
            if (PasswordFormat == MembershipPasswordFormat.Encrypted)
                password = DecodePassword(password);
            return password;
        }

        public override MembershipUser GetUser(string username, bool userIsOnline)
        {
            MembershipUser u = null;
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetUser))
            {
                sql.AssignParameter("UserName", username);
                if (sql.Read())
                    u = GetUser(sql);
            }
            if (userIsOnline && (u != null))
            {
                using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateLastUserActivity))
                {
                    sql.AssignParameter("LastActivityDate", DateTime.Now);
                    sql.AssignParameter("UserName", username);
                    sql.ExecuteNonQuery();
                }
            }
            return u;
        }

        public override MembershipUser GetUser(object providerUserKey, bool userIsOnline)
        {
            MembershipUser u = null;
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetUserByProviderKey))
            {
                sql.AssignParameter("UserID", providerUserKey);
                if (sql.Read())
                    u = GetUser(sql);
            }
            if (userIsOnline && (u != null))
            {
                using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateLastUserActivity))
                {
                    sql.AssignParameter("LastActivityDate", DateTime.Now);
                    sql.AssignParameter("UserName", u.UserName);
                    sql.ExecuteNonQuery();
                }
            }
            return u;
        }

        private MembershipUser GetUser(SqlStatement sql)
        {
            var providerUserKey = sql["UserID"];
            var username = Convert.ToString(sql["UserName"]);
            var email = Convert.ToString(sql["Email"]);
            var passwordQuestion = Convert.ToString(sql["PasswordQuestion"]);
            var comment = Convert.ToString(sql["Comments"]);
            var isApproved = Convert.ToBoolean(sql["IsApproved"]);
            var isLockedOut = Convert.ToBoolean(sql["IsLockedOut"]);
            var creationDate = Convert.ToDateTime(sql["CreationDate"]);
            var lastLoginDate = Convert.ToDateTime(sql["LastLoginDate"]);
            var lastActivityDate = Convert.ToDateTime(sql["LastActivityDate"]);
            var lastPasswordChangedDate = Convert.ToDateTime(sql["LastPasswordChangedDate"]);
            var lastLockedOutDate = Convert.ToDateTime(sql["LastLockedOutDate"]);
            return new MembershipUser(this.Name, username, providerUserKey, email, passwordQuestion, comment, isApproved, isLockedOut, creationDate, lastLoginDate, lastActivityDate, lastPasswordChangedDate, lastLockedOutDate);
        }

        public override bool UnlockUser(string username)
        {
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateUserLockStatus))
            {
                sql.AssignParameter("IsLockedOut", false);
                sql.AssignParameter("LastLockedOutDate", DateTime.Now);
                sql.AssignParameter("UserName", username);
                return (sql.ExecuteNonQuery() > 0);
            }
        }

        public override string GetUserNameByEmail(string email)
        {
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetUserNameByEmail))
            {
                sql.AssignParameter("Email", email);
                return Convert.ToString(sql.ExecuteScalar());
            }
        }

        public override string ResetPassword(string username, string answer)
        {
            if (!EnablePasswordReset)
                throw new NotSupportedException("Password reset is not enabled.");
            if (string.IsNullOrEmpty(answer) && RequiresQuestionAndAnswer)
            {
                UpdateFailureCount(username, "PasswordAnswer");
                throw new ProviderException("Password answer required for password reset.");
            }
            var newPassword = Membership.GeneratePassword(this._newPasswordLength, MinRequiredNonAlphanumericCharacters);
            var args = new ValidatePasswordEventArgs(username, newPassword, false);
            OnValidatingPassword(args);
            if (args.Cancel)
            {
                if (args.FailureInformation != null)
                    throw args.FailureInformation;
                else
                    throw new MembershipPasswordException("Reset password canceled due to password validation failure.");
            }
            var passwordAnswer = string.Empty;
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetPassword))
            {
                sql.AssignParameter("UserName", username);
                if (sql.Read())
                {
                    if (Convert.ToBoolean(sql["IsLockedOut"]))
                        throw new MembershipPasswordException("User is locked out.");
                    if (((DateTime)(sql["FailedPwdAnsAttemptWindowStart"])).AddMinutes(PasswordAttemptWindow) > DateTime.Now)
                        throw new MembershipPasswordException("Password answer attempt is not yet allowed.");
                    passwordAnswer = Convert.ToString(sql["PasswordAnswer"]);
                }
                else
                    throw new MembershipPasswordException("User is not found.");
            }
            if (RequiresQuestionAndAnswer && !CheckPassword(answer, passwordAnswer))
            {
                UpdateFailureCount(username, "PasswordAnswer");
                throw new MembershipPasswordException("Incorrect password answer.");
            }
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.ResetPassword))
            {
                sql.AssignParameter("Password", EncodePassword(newPassword));
                sql.AssignParameter("LastPasswordChangedDate", DateTime.Now);
                sql.AssignParameter("UserName", username);
                sql.AssignParameter("IsLockedOut", false);
                if (sql.ExecuteNonQuery() > 0)
                    return newPassword;
                else
                    throw new MembershipPasswordException("User is not found or locked out. Password has not been reset.");
            }
        }

        public override void UpdateUser(MembershipUser user)
        {
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateUser))
            {
                sql.AssignParameter("Email", user.Email);
                sql.AssignParameter("Comments", user.Comment);
                sql.AssignParameter("IsApproved", user.IsApproved);
                sql.AssignParameter("UserName", user.UserName);
                sql.ExecuteNonQuery();
            }
        }

        public override bool ValidateUser(string username, string password)
        {
            var isValid = false;
            string pwd = null;
            var isApproved = true;
            username = username.Trim();
            password = password.Trim();
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetPassword))
            {
                sql.AssignParameter("UserName", username);
                if (sql.Read())
                {
                    if (Convert.ToBoolean(sql["IsLockedOut"]))
                    {
                        if (((DateTime)(sql["FailedPwdAttemptWindowStart"])).AddMinutes(PasswordAttemptWindow) > DateTime.Now)
                            return false;
                    }
                    pwd = Convert.ToString(sql["Password"]);
                    isApproved = Convert.ToBoolean(sql["IsApproved"]);
                }
                else
                    return false;
            }
            if (CheckPassword(password, pwd))
            {
                if (isApproved)
                {
                    isValid = true;
                    using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateLastLoginDate))
                    {
                        sql.AssignParameter("LastLoginDate", DateTime.Now);
                        sql.AssignParameter("IsLockedOut", false);
                        sql.AssignParameter("UserName", username);
                        sql.ExecuteNonQuery();
                    }
                }
            }
            else
                UpdateFailureCount(username, "Password");
            return isValid;
        }

        private void UpdateFailureCount(string username, string failureType)
        {
            var failureCount = 0;
            var windowStart = DateTime.Now;
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.GetUser))
            {
                sql.AssignParameter("UserName", username);
                if (!sql.Read())
                    return;
                if (failureType == "Password")
                {
                    failureCount = Convert.ToInt32(sql["FailedPwdAttemptCount"]);
                    if (!DBNull.Value.Equals(sql["FailedPwdAttemptWindowStart"]))
                        windowStart = Convert.ToDateTime(sql["FailedPwdAttemptWindowStart"]);
                }
                if (failureType == "PasswordAnswer")
                {
                    failureCount = Convert.ToInt32(sql["FailedPwdAnsAttemptCount"]);
                    if (!DBNull.Value.Equals(sql["FailedPwdAnsAttemptWindowStart"]))
                        windowStart = Convert.ToDateTime(sql["FailedPwdAnsAttemptWindowStart"]);
                }
            }
            var windowEnd = windowStart.AddMinutes(PasswordAttemptWindow);
            if ((failureCount == 0) || (DateTime.Now > windowEnd))
            {
                if (failureType == "Password")
                {
                    using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateFailedPasswordAttempt))
                    {
                        sql.AssignParameter("FailedPwdAttemptCount", 1);
                        sql.AssignParameter("FailedPwdAttemptWindowStart", DateTime.Now);
                        sql.AssignParameter("UserName", username);
                        if (sql.ExecuteNonQuery() == 0)
                            throw new ProviderException("Unable to update password failure count and window start.");
                    }
                }
                if (failureType == "PasswordAnswer")
                {
                    using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateFailedPasswordAnswerAttempt))
                    {
                        sql.AssignParameter("FailedPwdAnsAttemptCount", 1);
                        sql.AssignParameter("FailedPwdAnsAttemptWindowStart", DateTime.Now);
                        sql.AssignParameter("UserName", username);
                        if (sql.ExecuteNonQuery() == 0)
                            throw new ProviderException("Unable to update password answer failure count and window start.");
                    }
                }
            }
            else
            {
                failureCount++;
                if (failureCount > MaxInvalidPasswordAttempts)
                {
                    using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateUserLockStatus))
                    {
                        sql.AssignParameter("IsLockedOut", true);
                        sql.AssignParameter("LastLockedOutDate", DateTime.Now);
                        sql.AssignParameter("UserName", username);
                        if (sql.ExecuteNonQuery() < 1)
                            throw new ProviderException("Unable to lock out user.");
                    }
                }
                else
                {
                    if (failureType == "Password")
                    {
                        using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateFailedPasswordAttempt))
                        {
                            sql.AssignParameter("FailedPwdAttemptCount", failureCount);
                            sql.AssignParameter("FailedPwdAttemptWindowStart", windowStart);
                            sql.AssignParameter("UserName", username);
                            if (sql.ExecuteNonQuery() == 0)
                                throw new ProviderException("Unable to update password failure count and window start.");
                        }
                    }
                    if (failureType == "PasswordAnswer")
                    {
                        using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.UpdateFailedPasswordAnswerAttempt))
                        {
                            sql.AssignParameter("FailedPwdAnsAttemptCount", failureCount);
                            sql.AssignParameter("FailedPwdAnsAttemptWindowStart", windowStart);
                            sql.AssignParameter("UserName", username);
                            if (sql.ExecuteNonQuery() == 0)
                                throw new ProviderException("Unable to update password answer failure count and window start.");
                        }
                    }
                }
            }
        }

        private bool CheckPassword(string password, string currentPassword)
        {
            var pass1 = password;
            var pass2 = currentPassword;
            if (PasswordFormat == MembershipPasswordFormat.Encrypted)
                pass2 = DecodePassword(currentPassword);
            else
            {
                if (PasswordFormat == MembershipPasswordFormat.Hashed)
                    pass1 = EncodePassword(password);
            }
            return (pass1 == pass2);
        }

        public string EncodePassword(string password)
        {
            var encodedPassword = password;
            if (PasswordFormat == MembershipPasswordFormat.Encrypted)
                encodedPassword = Convert.ToBase64String(EncryptPassword(Encoding.Unicode.GetBytes(password)));
            else
            {
                if (PasswordFormat == MembershipPasswordFormat.Hashed)
                {
                    var hash = new HMACSHA1()
                    {
                        Key = HexToByte(_validationKey)
                    };
                    encodedPassword = Convert.ToBase64String(hash.ComputeHash(Encoding.Unicode.GetBytes(password)));
                }
            }
            return encodedPassword;
        }

        public string DecodePassword(string encodedPassword)
        {
            var password = encodedPassword;
            if (PasswordFormat == MembershipPasswordFormat.Encrypted)
                password = Encoding.Unicode.GetString(DecryptPassword(Convert.FromBase64String(encodedPassword)));
            else
            {
                if (PasswordFormat == MembershipPasswordFormat.Hashed)
                    throw new ProviderException("Cannot decode a hashed password.");
            }
            return password;
        }

        public static byte[] HexToByte(string hexString)
        {
            var returnBytes = new byte[(hexString.Length / 2)];
            for (var i = 0; (i < returnBytes.Length); i++)
                returnBytes[i] = Convert.ToByte(hexString.Substring((i * 2), 2), 16);
            return returnBytes;
        }

        public override MembershipUserCollection FindUsersByName(string usernameToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            var users = new MembershipUserCollection();
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.CountUsersByName))
            {
                sql.AssignParameter("UserName", usernameToMatch);
                totalRecords = Convert.ToInt32(sql.ExecuteScalar());
            }
            if (totalRecords > 0)
            {
                var counter = 0;
                var startIndex = (pageSize * pageIndex);
                var endIndex = ((startIndex + pageSize) - 1);
                using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.FindUsersByName))
                {
                    sql.AssignParameter("UserName", usernameToMatch);
                    while (sql.Read())
                    {
                        if (counter >= startIndex)
                            users.Add(GetUser(sql));
                        if (counter >= endIndex)
                            break;
                        counter++;
                    }
                }
            }
            return users;
        }

        public override MembershipUserCollection FindUsersByEmail(string emailToMatch, int pageIndex, int pageSize, out int totalRecords)
        {
            var users = new MembershipUserCollection();
            using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.CountUsersByEmail))
            {
                sql.AssignParameter("UserName", emailToMatch);
                totalRecords = Convert.ToInt32(sql.ExecuteScalar());
            }
            if (totalRecords > 0)
            {
                var counter = 0;
                var startIndex = (pageSize * pageIndex);
                var endIndex = ((startIndex + pageSize) - 1);
                using (var sql = CreateSqlStatement(MembershipProviderSqlStatement.FindUsersByEmail))
                {
                    sql.AssignParameter("Email", emailToMatch);
                    while (sql.Read())
                    {
                        if (counter >= startIndex)
                            users.Add(GetUser(sql));
                        if (counter >= endIndex)
                            break;
                        counter++;
                    }
                }
            }
            return users;
        }

        protected override void OnValidatingPassword(ValidatePasswordEventArgs e)
        {
            try
            {
                var password = e.Password;
                if (password.Length < MinRequiredPasswordLength)
                    throw new ArgumentException("Invalid password length.");
                var count = 0;
                for (var i = 0; (i < password.Length); i++)
                    if (!Char.IsLetterOrDigit(password, i))
                        count++;
                if (count < MinRequiredNonAlphanumericCharacters)
                    throw new ArgumentException("Password needs more non-alphanumeric characters.");
                if (!string.IsNullOrEmpty(PasswordStrengthRegularExpression))
                {
                    if (!Regex.IsMatch(password, PasswordStrengthRegularExpression))
                        throw new ArgumentException("Password does not match regular expression.");
                }
                base.OnValidatingPassword(e);
                if (e.Cancel)
                {
                    if (e.FailureInformation != null)
                        throw e.FailureInformation;
                    else
                        throw new ArgumentException("Custom password validation failure.");
                }
            }
            catch (Exception ex)
            {
                e.FailureInformation = ex;
                e.Cancel = true;
            }
        }
    }

    public enum RoleProviderSqlStatement
    {

        AddUserToRole,

        CreateRole,

        DeleteRole,

        DeleteRoleUsers,

        GetAllRoles,

        GetRolesForUser,

        GetUsersInRole,

        IsUserInRole,

        RemoveUserFromRole,

        RoleExists,

        FindUsersInRole,
    }

    internal sealed class PostgresRoleProvider : RoleProvider
    {

        public static SortedDictionary<RoleProviderSqlStatement, string> Statements = new SortedDictionary<RoleProviderSqlStatement, string>();

        private ConnectionStringSettings _connectionStringSettings;

        private bool _writeExceptionsToEventLog;

        [System.Diagnostics.DebuggerBrowsable(System.Diagnostics.DebuggerBrowsableState.Never)]
        private string _applicationName;

        static PostgresRoleProvider()
        {
            Statements[RoleProviderSqlStatement.AddUserToRole] = "insert into aspnet_user_roles(user_id, role_id)  values ((select user_id from aspnet_users where user_name=@UserName), (select role_id from aspnet_roles where role_name=@RoleName))";
            Statements[RoleProviderSqlStatement.CreateRole] = "insert into aspnet_roles (role_id, role_name) values (@RoleId, @RoleName)";
            Statements[RoleProviderSqlStatement.DeleteRole] = "delete from aspnet_roles where role_name = @RoleName";
            Statements[RoleProviderSqlStatement.DeleteRoleUsers] = "delete from aspnet_user_roles where role_id in (select role_id from aspnet_roles where role_name = @RoleName)";
            Statements[RoleProviderSqlStatement.GetAllRoles] = "select role_name RoleName from aspnet_roles";
            Statements[RoleProviderSqlStatement.GetRolesForUser] = "select Roles.role_name RoleName from aspnet_roles Roles  inner join aspnet_user_roles UserRoles on Roles.role_id = UserRoles.role_id  inner join aspnet_users Users on Users.user_id = UserRoles.user_id where Users.user_name = @UserName";
            Statements[RoleProviderSqlStatement.GetUsersInRole] = "select user_name UserName from aspnet_users where user_id in (select user_id from aspnet_user_roles where role_id in (select role_id from aspnet_roles where role_name = @RoleName))";
            Statements[RoleProviderSqlStatement.IsUserInRole] = "select count(*) from aspnet_user_roles where     user_id in (select user_id from aspnet_users where user_name = @UserName) and role_id in (select role_id from aspnet_roles where role_name = @RoleName)";
            Statements[RoleProviderSqlStatement.RemoveUserFromRole] = "delete from aspnet_user_roles where    user_id in (select user_id from aspnet_users where user_name = @UserName) and    role_id in (select role_id from aspnet_roles where role_name = @RoleName)";
            Statements[RoleProviderSqlStatement.RoleExists] = "select count(*) from aspnet_roles where role_name = @RoleName";
            Statements[RoleProviderSqlStatement.FindUsersInRole] = @"select Users.user_name UserName from aspnet_users Users
inner join aspnet_user_roles UserRoles on Users.user_id= UserRoles.user_id
inner join aspnet_roles Roles on UserRoles.role_id = Roles.role_id
where
    Users.user_name like @UserName and
    Roles.role_name = @RoleName";
        }

        public ConnectionStringSettings ConnectionStringSettings
        {
            get
            {
                return _connectionStringSettings;
            }
        }

        public bool WriteExceptionsToEventLog
        {
            get
            {
                return _writeExceptionsToEventLog;
            }
        }

        public override string ApplicationName
        {
            get
            {
                return _applicationName;
            }
            set
            {
                _applicationName = value;
            }
        }

        private SqlStatement CreateSqlStatement(RoleProviderSqlStatement command)
        {
            var sql = new SqlText(Statements[command], ConnectionStringSettings.Name);
            sql.Command.CommandText = sql.Command.CommandText.Replace("@", sql.ParameterMarker);
            if (sql.Command.CommandText.Contains((sql.ParameterMarker + "ApplicationName")))
                sql.AssignParameter("ApplicationName", ApplicationName);
            sql.Name = ("FreeTrial Application Role Provider - " + command.ToString());
            sql.WriteExceptionsToEventLog = WriteExceptionsToEventLog;
            return sql;
        }

        public override void Initialize(string name, NameValueCollection config)
        {
            if (config == null)
                throw new ArgumentNullException("config");
            if (string.IsNullOrEmpty(name))
                name = "PostgresRoleProvider";
            if (string.IsNullOrEmpty(config["description"]))
            {
                config.Remove("description");
                config.Add("description", "FreeTrial application role provider");
            }
            base.Initialize(name, config);
            _applicationName = config["applicationName"];
            if (string.IsNullOrEmpty(_applicationName))
                _applicationName = System.Web.Hosting.HostingEnvironment.ApplicationVirtualPath;
            _writeExceptionsToEventLog = "true".Equals(config["writeExceptionsToEventLog"], StringComparison.CurrentCulture);
            _connectionStringSettings = ConfigurationManager.ConnectionStrings[config["connectionStringName"]];
            if ((_connectionStringSettings == null) || string.IsNullOrEmpty(_connectionStringSettings.ConnectionString))
                throw new ProviderException("Connection string cannot be blank.");
        }

        public override void AddUsersToRoles(string[] usernames, string[] rolenames)
        {
            foreach (var rolename in rolenames)
                if (!RoleExists(rolename))
                    throw new ProviderException(string.Format("Role name '{0}' not found.", rolename));
            foreach (var username in usernames)
            {
                if (username.Contains(","))
                    throw new ArgumentException("User names cannot contain commas.");
                foreach (var rolename in rolenames)
                    if (IsUserInRole(username, rolename))
                        throw new ProviderException(string.Format("User '{0}' is already in role '{1}'.", username, rolename));
            }
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.AddUserToRole))
                foreach (var username in usernames)
                {
                    ForgetUserRoles(username);
                    foreach (var rolename in rolenames)
                    {
                        sql.AssignParameter("UserName", username);
                        sql.AssignParameter("RoleName", rolename);
                        sql.ExecuteNonQuery();
                    }
                }
        }

        public override void CreateRole(string rolename)
        {
            if (rolename.Contains(","))
                throw new ArgumentException("Role names cannot contain commas.");
            if (RoleExists(rolename))
                throw new ProviderException("Role already exists.");
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.CreateRole))
            {
                sql.AssignParameter("RoleId", Guid.NewGuid());
                sql.AssignParameter("RoleName", rolename);
                sql.ExecuteNonQuery();
            }
        }

        public override bool DeleteRole(string rolename, bool throwOnPopulatedRole)
        {
            if (!RoleExists(rolename))
                throw new ProviderException("Role does not exist.");
            if (throwOnPopulatedRole && (GetUsersInRole(rolename).Length > 0))
                throw new ProviderException("Cannot delete a pouplated role.");
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.DeleteRole))
            {
                using (var sql2 = CreateSqlStatement(RoleProviderSqlStatement.DeleteRoleUsers))
                {
                    sql2.AssignParameter("RoleName", rolename);
                    sql2.ExecuteNonQuery();
                }
                sql.AssignParameter("RoleName", rolename);
                sql.ExecuteNonQuery();
            }
            return true;
        }

        public override string[] GetAllRoles()
        {
            var roles = new List<string>();
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.GetAllRoles))
                while (sql.Read())
                    roles.Add(Convert.ToString(sql["RoleName"]));
            return roles.ToArray();
        }

        public override string[] GetRolesForUser(string username)
        {
            List<string> roles = null;
            var userRolesKey = string.Format("PostgresRoleProvider_{0}_Roles", username);
            var contextIsAvailable = (HttpContext.Current != null);
            if (contextIsAvailable)
                roles = ((List<string>)(HttpContext.Current.Items[userRolesKey]));
            if (roles == null)
            {
                roles = new List<string>();
                using (var sql = CreateSqlStatement(RoleProviderSqlStatement.GetRolesForUser))
                {
                    sql.AssignParameter("UserName", username);
                    while (sql.Read())
                        roles.Add(Convert.ToString(sql["RoleName"]));
                    if (contextIsAvailable)
                        HttpContext.Current.Items[userRolesKey] = roles;
                }
            }
            return roles.ToArray();
        }

        public void ForgetUserRoles(string username)
        {
            if (HttpContext.Current != null)
                HttpContext.Current.Items.Remove(string.Format("PostgresRoleProvider_{0}_Roles", username));
        }

        public override string[] GetUsersInRole(string rolename)
        {
            var users = new List<string>();
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.GetUsersInRole))
            {
                sql.AssignParameter("RoleName", rolename);
                while (sql.Read())
                    users.Add(Convert.ToString(sql["UserName"]));
            }
            return users.ToArray();
        }

        public override bool IsUserInRole(string username, string rolename)
        {
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.IsUserInRole))
            {
                sql.AssignParameter("UserName", username);
                sql.AssignParameter("RoleName", rolename);
                return (Convert.ToInt32(sql.ExecuteScalar()) > 0);
            }
        }

        public override void RemoveUsersFromRoles(string[] usernames, string[] rolenames)
        {
            foreach (var rolename in rolenames)
                if (!RoleExists(rolename))
                    throw new ProviderException(string.Format("Role '{0}' not found.", rolename));
            foreach (var username in usernames)
                foreach (var rolename in rolenames)
                    if (!IsUserInRole(username, rolename))
                        throw new ProviderException(string.Format("User '{0}' is not in role '{1}'.", username, rolename));
            foreach (var username in usernames)
            {
                ForgetUserRoles(username);
                foreach (var rolename in rolenames)
                {
                    using (var sql = CreateSqlStatement(RoleProviderSqlStatement.RemoveUserFromRole))
                    {
                        sql.AssignParameter("UserName", username);
                        sql.AssignParameter("RoleName", rolename);
                        sql.ExecuteNonQuery();
                    }
                }
            }
        }

        public override bool RoleExists(string rolename)
        {
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.RoleExists))
            {
                sql.AssignParameter("RoleName", rolename);
                return (Convert.ToInt32(sql.ExecuteScalar()) > 0);
            }
        }

        public override string[] FindUsersInRole(string rolename, string usernameToMatch)
        {
            var users = new List<string>();
            using (var sql = CreateSqlStatement(RoleProviderSqlStatement.FindUsersInRole))
            {
                sql.AssignParameter("UserName", usernameToMatch);
                sql.AssignParameter("RoleName", rolename);
                while (sql.Read())
                    users.Add(Convert.ToString(sql["UserName"]));
            }
            return users.ToArray();
        }
    }
}
