# aws_mfa
Node.js CLI app to set AWS MFA credentials.  
When developing application I was driven by own requirements:
- Multi AWS account support
- CLI
- Multi-platform (Run on Windows, Mac, Linux)
- Scripted, no build/compilation
- No need to check expiration. When temporary access token expired, I will get 403 error and I will run tool on demand
- No long command line with many options
- Simplified configuration

There are many tools which save temporary access credentials to environment variable. I have choosen approach to save temporary access token in ~/.aws/credentials profile. Usage of spesific profile requires `--profile` aws command line argument but it allows simultaneous use of different profiles. If environment variables would be used, every switch of aws environment/account would require tool rerun.

# Configuration
MFA device arn configuration is fetched from `~/.aws/config` file.
MFA ARN shoud be specified as additional parameter in profile used to fetch temporary access token. Please note: Temporary credentials cannot be used to get another temporary credentials. In example bellow. `[profile no-mfa]' uses credentials which can be used to acquire session token.
For example
```ini
[default]
region=eu-west-1
output=json

[profile no-mfa]
region=eu-west-1
output=json
mfa_arn=arn:aws:iam::123456789012:mfa/firstname.lastname@company.eu

[profile mfa]
region=eu-west-1
output=json
```

mfa.js will read ~/.aws/config file and populae list of profile to be used as "source" (one to fetch session cedentials) by examining presence of parameter `mfa_arn`.  
Acquired temporary credentials will be saved in `~/.aws/credentials` file in profile selected when script is executed.  
mfa.js will populate list of 'destination' profiles by examinig ~/.aws/credentials file and looking for profile which has key `aws_session_token`. This logic was added to minimaze number of profiles displayed in menu selection and possibly avoiding overriding 'non MFA' profile credentials. Here is example of credentials file.
```ini
[default]
aws_access_key_id=ASIAAAAAAAAAAA
aws_secret_access_key=+Ix0zwalvhkhxvxlhYE
aws_session_token=Ixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
expires=2022-02-29T09:50:51+00:00

[no-mfa]
aws_access_key_id=AKIAXXXXXXXXXSE
aws_secret_access_key=O4+nlkhjYomn3bq

[mfa]
aws_access_key_id=ASIAAAAAAAAABBAA
aws_secret_access_key=+Ix0zwalvhkhxvxlhgfYE
aws_session_token=Ixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxyyyy
expires=2022-05-29T09:50:51+00:00
```
