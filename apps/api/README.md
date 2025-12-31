# Mongodb
## Using Docker container
Use this command to connect to 

### General structure
```bash
docker exec -it <containerNamecontainer_name_or_id> mongosh -u <username> -p <password> --authenticationDatabase admin
```


### Specific for my application

```bash
docker exec -it mongodb mongosh -u doraemon -p robot --authenticationDatabase admin
```

## With mongosh installed in system

### General structure
```bash
mongosh "mongodb://<username>:<password>@localhost:27017/<dbname>?authSource=admin"
```
### Specific for my application
```bash
mongosh "mongodb://doraemon:robot@localhost:27017/zeroVaultDB?authSource=admin"
```