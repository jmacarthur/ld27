#!/usr/bin/perl -w

sub setShardUser
{
    my($dbh, $shardID, $userID) = @_;
    my $sth = $dbh->prepare("UPDATE shard SET nextuser=? WHERE shardid=?");
    my $rh = $sth->execute($userID,$shardID);
    print "Next user of shard $shardID has been set to $userID\n";
}


return 1;
