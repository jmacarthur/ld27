#!/usr/bin/perl -w

sub setShardUser
{
    my($dbh, $shardID, $userID) = @_;
    my $sth = $dbh->prepare("UPDATE shard SET nextuser=? WHERE shardid=?");
    my $rh = $sth->execute($userID,$shardID);
    print "Next user of shard $shardID has been set to $userID\n";
}

sub touchTimeStamp
{
    my($dbh, $userID) = @_;
    my $sth = $dbh->prepare("UPDATE userids SET lastseen=datetime('now') WHERE userid=?");
    my $rh = $sth->execute($userID);
}

sub getShardStatus
{
    my ($dbh,$shardID) = @_;
    my $sth = $dbh->prepare("SELECT status from shard where shardid=?");
    my $rh = $sth->execute($shardID);
    my @array = $sth->fetchrow_array();
    if(@array>0) {
        return $array[0];
    }
    return -1;
}

sub newShard
{
    my $dbh = shift;
    my $sth = $dbh->prepare("INSERT INTO shard (status,playerx,playery,time,mapUpdates,inventory) VALUES (0,64,64,0,'','0,0,0,0');");
    my $rh = $sth->execute();
    $shardID = $dbh->func('last_insert_rowid');
    return $shardID;
}

sub recordShardPlayer
{ 
    my ($dbh, $shardID, $userID) = @_;
    my $sth = $dbh->prepare("INSERT INTO sharduser (shardid,userid) VALUES (?,?);");
    my $rh = $sth->execute($shardID,$userID); # May fail  due to unique constraint, that's OK
}


return 1;
